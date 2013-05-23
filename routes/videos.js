var validator = require('./videoValidator');
var HttpError = require('http-error').HttpError;
var queue = null;

var createResult = function(res, code, resource) {
  var data = resource.getValue();
  data.id = resource.id;
  return res.jsonp(code, data);
};
exports._createResult = createResult;

exports.setQueue = function(RedisQueue) {
  queue = RedisQueue;
};

exports.show = function(req, res, next) {
  if (req.params.id) {
    queue.handler.get(req.params.id, function(err, resource) {
      if (err) {
        return next(new HttpError(err, 500));
      }
      if (resource === null) {
        return next(new HttpError("Video not found", 404));
      }
      return createResult(res, 200, resource);
    });
    return;
  }
  return next(new HttpError("An id is necessary to be sent", 400));
};

exports.create = function(req, res, next) {
  try {
    var content = validator.parseAndValidate(req.body.data || req.body);
    queue.createAndPush(100000, content, function(err, resource) {
      if (err) {
        return next(new HttpError(err, 500));
      }
      return createResult(res, 201, resource);
    });
  } catch(e) {
    return next(new HttpError(e.message, 400));
  }
};
