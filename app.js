/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');
var redis = require('redis');
var jobberTrack = require('jobber-track');
var config = require('./config');


var app = express();

app.configure(function(){
  var client = redis.createClient(config.redis.port,
                                  config.redis.host,
                                  "");
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
    if (config.version === 'development') {
      res.locals.app.js_url = "/javascripts/";
      res.locals.app.css_url = "/stylesheets/";
    } else {
      res.locals.app.js_url = "//" + config.aws.cloudfront + '/' + config.version;
      res.locals.app.css_url = res.locals.app.js_url;
    }
    next();
  });
  if (config.version === "development") {
    app.use(require('less-middleware')({ src: __dirname + '/public' }));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(app.router);
    app.use(express.errorHandler());
  } else {
    app.set('view cache', true);
    app.use(app.router);
    app.use(function(err, req, res, next){
      console.error(err.stack);
      res.render('500', {title: "Wideor.it | 500 Our Error"});
    });
  }
});

notFound = function(req, res) {
  if (req.xhr) {
    routes.videos.notFound(req, res);
  } else {
    res.status(404);
    res.render('404', {title: "Wideor.it | 404 Not Foud"});
  }
};

app.get('/', routes.index);
app.get('/about', routes.about);
app.get('/videos/:id', routes.empty);
app.get('/videos/add', routes.empty);
app.post('/images', routes.images.upload);

app.get('/api/videos/:id', routes.videos.show);
app.post('/api/videos', routes.videos.create);
app.all('/*', notFound);

console.log("Starting version:", config.version);

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
