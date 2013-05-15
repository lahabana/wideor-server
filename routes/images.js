var formidable = require('formidable');
var fs = require('fs');
var knox = require('knox');
var MultiPartUpload = require('knox-mpu');
var config = require('../config');
var child = require('child_process');
var request = require('request');

var S3 = knox.createClient({key: config.aws.key,
                                 secret: config.aws.secret,
                                 bucket: config.aws.bucket_image
                            });

var createError = function(res, code, message) {
  code = code || 500;
  message = message || "Unexpected error";
  return res.jsonp(code, {code:code, message:message});
};

var convertAndUpload = function(stream, options, cb) {
  var ext = options.format.split('/')[1]
  var convert = child.spawn('convert', [ext + ':fd:0', '-background', options.bg,
                                        '-resize', options.size, '-gravity', 'center', 
                                        '-extent', options.size,
                                        '-strip', '-sampling-factor', '4:2:2', '-type', 'TrueColor',
                                        'jpeg:-']);
  stream.pipe(convert.stdin);

  var upload = new MultiPartUpload({
      client: S3,
      objectName: new Date().getTime() + '.' + ext, // Amazon S3 object name
      stream: convert.stdout,
      headers: {
        'Content-Type': options.format,
        'x-amz-acl': 'public-read'
      }
  }, function(err, result) {
    if (err) {
      cb(err);
    } else {
      cb(false, {path: result.Location, format: ext});
    }
  });
};

exports.upload = function(req, res) {
  // parse a file upload
  var resultCb = function(err, result) {
    if (err) {
      createError(res, 400, err);
    } else {
      res.jsonp(200, result);
    }
  };
  // It's a form we will have to parse the file from the form
  if (/multipart\/form-data.*/.test(req.headers['content-type'])) {
    form = new formidable.IncomingForm();
    
    form.onPart = function(part) {
      if (part.filename) {
        convertAndUpload(part, {format: part.mime, size: '640x480', bg: '#000000'}, resultCb);
      }
    };
    form.parse(req);
  } else { 
    // It's a json with a url
    req.data = '';
    req.on('data', function(data) {
      if (req.data.length >= 1e6) {
        return createError(res, 400, "body too long");
      }
      req.data += data;
    });
    req.on('end', function() {
      try {
        var body = JSON.parse(req.data);
        body = body.data || body;
      } catch (e) {
        return createError(res, 400, "invalid json posted");
      }
      var reqt = request(body.path);
      convertAndUpload(reqt, {format: body.format, size: '640x480', bg: '#000000'}, resultCb);
    });
  }
};
