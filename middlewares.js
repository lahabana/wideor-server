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

  // Depending on the type of request we return the same
  if (req.xhr) {
    return res.jsonp(result.code, result);
  }
  res.status(result.code);
  return res.render('error', {title: "Wideor.it | " + result.code + " Error ",
                              message: result.message});
};

exports.notFound = function(req, res) {
  res.status(404);
  res.render('404', {title: "Wideor.it | 404 Not Found"});
};

exports.jadeVariables = function(config) {
  return function(req, res, next) {
    res.locals.app = {
      version: config.version,
      api_url : config.apiUrl
    };
    if (config.version === 'development') { //In dev we use the local js and style
      res.locals.app.js_url = "/javascripts/";
      res.locals.app.css_url = "/stylesheets/";
    } else { //In prod we use the cloudfront files of the runned version
      res.locals.app.js_url = "//" + config.aws.cloudfront + '/' + config.version;
      res.locals.app.css_url = res.locals.app.js_url;
    }
    next();
  };
};
