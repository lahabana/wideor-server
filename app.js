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
var middlewares = require('./middlewares');

var app = express();

app.configure(function(){
  var client = redis.createClient(config.redis.port,
                                  config.redis.host,
                                  "");
  app.set('redis-client', client);
  app.set('port', config.port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  // Set all the middlewares
  app.use(express.favicon(__dirname + "/public/favicon.ico", {maxAge: 2592000000}));
  app.use(express.bodyParser());
  app.use(express.logger('dev'));
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(middlewares.jadeVariables(config));
  if (config.version === "development") {
    app.use(require('less-middleware')({ src: __dirname + '/public' }));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(app.router);
  } else {
    app.set('view cache', true);
    app.use(app.router);
  }
  app.use(middlewares.errorHandler);
  app.use(middlewares.notFound);
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
  // Access to our job tracker to add videos and retrieve their status
  jobberTrack(app.get('redis-client'), config.redis.prefix, function(err, track) {
    routes.videos.setTracker(track);
    console.log("Connected to redis client");
    http.createServer(app).listen(app.get('port'), function() {
      console.log("Express server listening on port " + app.get('port'));
    });
  });
});

app.get('redis-client').on('error', function() {
  console.error("Could not connect to redis server");
});
