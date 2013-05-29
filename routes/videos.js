var validator = require('./videoValidator');
var HttpError = require('http-error').HttpError;
var tracker = null;

var createResult = function(res, code, resource) {
  return res.jsonp(code, resource.serialize());
};
exports._createResult = createResult;

exports.setTracker = function(track) {
  tracker = track;
};

exports.getTracker = function() {
  return tracker;
};

exports.show = function(req, res, next) {
  if (req.params.id) {
    return tracker.get(req.params.id, function(err, resource) {
      if (err) {
        return next(new HttpError(err, 500));
      }
      if (resource === null) {
        return next(new HttpError("Video not found", 404));
      }
      return createResult(res, 200, resource);
    });
  }
  return next(new HttpError("An id is necessary to be sent", 400));
};

exports.create = function(req, res, next) {
  try {
    var content = validator.parseAndValidate(req.body.data || req.body);
    tracker.createAndPush(content, function(err, id) {
      if (err) {
        return next(new HttpError(err, 500));
      }
      return res.jsonp(201, {id:id});
    });
  } catch(e) {
    return next(new HttpError(e.message, 400));
  }
};
