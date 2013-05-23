var HttpError = require('http-error').HttpError;

exports.errorHandler = function(err, req, res, next) {
  var result;
  if (err instanceof HttpError) { // This error has a nice http code etc
    result = err;
  } else { //This is an error not really well handled we change it to a 500
    result = {
      code: 500,
      message: err.message || "We don't know what happened here ;)"
    };
    console.error(err.stack || err);
  }

  // Depending of the type of request we return the same
  if (req.xhr) {
    return res.jsonp(result.code, result);
  }
  res.status(result.code);
  return res.render('error', {title: "Wideor.it | " + result.code + " Error ",
                              message: result.message});
};

exports.notFound = function(req, res, next) {
  res.status(404);
  res.render('404', {title: "Wideor.it | 404 Not Found"});
};
