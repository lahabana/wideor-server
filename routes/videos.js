var queue = null;

var createError = function(res, code, message) {
  code = code || 500;
  message = message || "Unexpected error";
  return res.jsonp(code, {code:code, message:message});
}

var supportedFormat = {
  "jpg": "jpg",
  "jpeg": "jpeg",
  "png": "png"
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
      if (!files[i].path || !files[i].format) {
        return {err: true, message: "Each file needs a path and a supported format. This is" +
                                    "not the case for file:" + i + "=" +
                                    JSON.stringify(files[i])};
      }
    }
    content.files = files;
  }
  if (duration) {
    if (typeof(duration) !== "number" || duration < 0) {
      return {err: true, message: "The duration if specified needs to be a number"};
    } else {
      content.duration = duration;
    }
  } else {
    content.duration = 1;
  }
  if (format) {
    format = /[0-9]+(x|X)[0-9]+/.test(format) ? format.toLowerCase() : "";
    var splitted = format.split('x');
    if (splitted.length !== 2 || splitted[0] <= 0 || splitted[1] <= 0) {
      return {err: true, message: "The format must be a string of type [width]x[height]"};
    }
    content.format = format;
  } else {
    content.format = "640x480";
  }
  return content;
}

exports.create = function(req, res) {
  var content = checkAndCreateContent(req.body.files, req.body.duration, req.body.format);
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
};
