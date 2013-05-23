var validator = require('./videoValidator');
var queue = null;

var createError = function(res, code, message) {
  code = code || 500;
  message = message || "Unexpected error";
  return res.jsonp(code, {code:code, message:message});
};
exports._createError = createError;

var createResult = function(res, code, resource) {
  var data = resource.getValue();
  data.id = resource.id;
  return res.jsonp(code, data);
};
exports._createResult = createResult;

exports.setQueue = function(RedisQueue) {
  queue = RedisQueue;
};

exports.show = function(req, res) {
  if (req.params.id) {
    queue.handler.get(req.params.id, function(err, resource) {
      if (err) {
        return createError(res, 500, err);
      }
      if (resource === null) {
        return createError(res, 404, "Video not found");
      }
      return createResult(res, 200, resource);
    });
    return;
  }
  return createError(res, 400, "An id is necessary to be sent");
};

exports.create = function(req, res) {
  try {
    var content = validator.parseAndValidate(req.body.data || req.body);
    queue.createAndPush(100000, content, function(err, resource) {
      if (err) {
        return createError(res, 500, err);
      }
      return createResult(res, 201, resource);
    });
  } catch(e) {
    return createError(res, 400, e.message);
  }
};

exports.notFound = function(req, res) {
  return createError(res, 404, "Not Found");
};
