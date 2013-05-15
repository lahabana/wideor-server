var queue = null;

var createError = function(res, code, message) {
  code = code || 500;
  message = message || "Unexpected error";
  return res.jsonp(code, {code:code, message:message});
};

var supportedFormat = {
  "jpg": "jpg",
  "jpeg": "jpg",
  "png": "png"
};

var reUrl = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;

var isNumber = function(number) {
  return typeof(+number) === "number" && isFinite(+number) && !isNaN(+number);
};

exports.supportedFormat = supportedFormat;

exports.setQueue = function(RedisQueue) {
  queue = RedisQueue;
}

exports.show = function(req, res) {
  if (req.params.id) {
    queue.handler.get(req.params.id, function(err, resource) {
      if (err) {
        return createError(res, 500, err);
      }
      if (resource === null) {
        return res.jsonp(404, "Video not found");
      }
      var data = resource.getValue();
      data.id = resource.id;
      return res.jsonp(200, data);
    });
    return;
  }
  return createError(res, 400, "An id is necessary to be sent");
};

var checkAndCreateContent = function(files, duration, format) {
  var content = {};
  if (!files || files.length === 0) {
    return {err: true, message: "You need to specify more than one file"};
  } else {
    for (var i = 0; i < files.length; i++) {
      files[i].format = typeof(files[i].format) === "string" ?
                          supportedFormat[files[i].format.toLowerCase()] : null;
      if (!reUrl.test(files[i].path) || !files[i].format) {
        return {err: true, message: "Each file needs a path and a supported format. This is" +
                                    "not the case for file:" + i + "=" +
                                    JSON.stringify(files[i])};
      }
    }
    content.files = files;
  }
  if (duration) {
    if (!isNumber(duration) || duration <= 0) {
      return {err: true, message: "The duration if specified needs to be a number"};
    } else {
      content.duration = duration;
    }
  } else {
    content.duration = 1;
  }
  if (format) {
    var format = (format + '').toLowerCase().split('x');
    if (format.length !== 2 || !isNumber(format[0]) || !isNumber(format[1]) ||
            (+format[0]) <= 0 || (+format[1]) <= 0) {
      return {err: true, message: "The format must be a string of type [width]x[height]"};
    }
    content.format = format[0] + 'x' + format[1];
  } else {
    content.format = "640x480";
  }
  return content;
}

exports.create = function(req, res) {
  req.data = '';
  req.on('data', function(data) {
    if (req.data.length >= 1e6) {
      return createError(res, 400, "body too long");
    }
    req.data += data;
  });
  console.log(req.data);
  req.on('end', function() {
    try {
      var body = JSON.parse(req.data);
      body = body.data || body;
    } catch (e) {
      return createError(res, 400, "invalid json posted");
    }
    var content = checkAndCreateContent(body.files, body.duration, body.format);
    if (content.err) {
      return createError(res, 400, content.message);
    }
    queue.createAndPush(100000, content, function(err, resource) {
      if (err) {
        return createError(res, 500, err);
      }
      var result = resource.getValue();
      result.id = resource.id;
      return res.jsonp(201, result);
    });
  });
};

exports.notFound = function(req, res) {
  return createError(res, 404, "Not Found");
};
