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
  var ext = options.format.split('/')[1];
  var convert = child.spawn('convert', [ext + ':fd:0', '-background', options.bg,
                                        '-resize', options.size, '-gravity', 'center',
                                        '-extent', options.size,
                                        '-strip', '-sampling-factor', '4:2:2', '-type', 'TrueColor',
                                        'jpeg:-']);
  stream.pipe(convert.stdin);

  convert.stderr.on('data', function(data) {
    return cb("Invalid file couldn't convert");
  });
  var upload = new MultiPartUpload({
      client: S3,
      objectName: new Date().getTime() + '.jpeg', // Amazon S3 object name
      stream: convert.stdout,
      headers: {
        'Content-Type': 'image/jpeg',
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

exports.upload = function(req, res, next) {
  var size = req.query.size;
  var stream;
  var options = {size: size, bg: '#000000'};
  if (!size) {
    createError(res, 400, "The size is not valid");
  }

  // It's a form we will have to parse the file from the form
  if (/multipart\/form-data.*/.test(req.headers['content-type'])) {
    stream = fs.createReadStream(req.files.file.path);
    options.format = req.files.file.type;
  } else {
    stream = request(req.body.path);
    options.format = 'image/' + req.body.format;
  }
  try {
    convertAndUpload(stream,
                    options,
                    function(err, result) {
                      if (err) {
                        createError(res, 400, err);
                      } else {
                        res.jsonp(200, result);
                      }
                    });
  } catch (e) {
    console.error(e);
    return createError(res, 400, "Invalid file");
  }
};

var onEnd = function() {
  throw new Error("no uploaded file");
};

var convertExternal = function(req, res) {
  var size = req.query.size;
  console.log(req.body);
};
