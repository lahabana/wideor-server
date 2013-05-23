/**
Copyright (c) 2013 Charly Molter

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * Express app for the website and the API. We may have to split API and site in 2 distinct parts soon.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');
var redis = require('redis');
var jobberTrack = require('jobber-track');
var config = require('./config');
var HttpError = require('http-error').HttpError;

var app = express();

app.configure(function(){
  var client = redis.createClient(config.redis.port,
                                  config.redis.host,
                                  "");
  // Access to our job queue to add videos and retrieve their status
  var queue = new jobberTrack.Queue(client, config.redis.queue_name);
  app.set('redis-client', client);
  app.set('queue', queue);
  app.set('port', config.port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon(__dirname + "/public/favicon.ico", {maxAge: 2592000000}));
  app.use(express.bodyParser());
  app.use(express.logger('dev'));
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(function(req, res, next) {
    res.locals.app = {
      version: config.version
    };
    // In development we use the local js and style
    if (config.version === 'development') {
      res.locals.app.js_url = "/javascripts/";
      res.locals.app.css_url = "/stylesheets/";
    // In prod we use the cloudfront files of the runned version
    } else {
      res.locals.app.js_url = "//" + config.aws.cloudfront + '/' + config.version;
      res.locals.app.css_url = res.locals.app.js_url;
    }
    res.locals.app.api_url = config.apiUrl;
    next();
  });
  if (config.version === "development") {
    app.use(require('less-middleware')({ src: __dirname + '/public' }));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(app.router);
  } else {
    app.set('view cache', true);
    app.use(app.router);
  }

  // The error handler
  app.use(function(err, req, res, next) {
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
  });
});

app.use(function(req, res, next) {
  res.status(404);
  res.render('404', {title: "Wideor.it | 404 Not Found"});
});
// Currently we have index and about which are real pages
// The rest is just an empty page which backbone will render
// This will have to change.
app.get('/', routes.index);
app.get('/about', routes.about);
app.get('/videos/:id', routes.empty);
app.get('/videos/add', routes.empty);
// Upload an image to the s3 and convert it returns a json with the info
app.post('/images', routes.images.upload);

// The routes to the API
app.get('/api/videos/:id', routes.videos.show);
app.post('/api/videos', routes.videos.create);

console.log("Starting version:", config.version);

// When the redis-client is ready we can really start the app
app.get('redis-client').on('ready', function() {
  routes.videos.setQueue(app.get('queue'));
  console.log("Connected to redis client");
  http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
  });
});

app.get('redis-client').on('error', function() {
  console.error("Could not connect to redis server");
});
