/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');
var redis = require('redis');
var jobberTrack = require('jobber-track');

var app = express();

app.configure(function(){
  var client = redis.createClient(process.env.WIDEOR_REDIS_PORT || 6379,
                                  process.env.WIDEOR_REDIS_HOST || "127.0.0.1",
                                  "");
  var queue = new jobberTrack.Queue(client, process.env.WIDEOR_QUEUE_NAME);
  app.set('redis-client', client);
  app.set('queue', queue);
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/videos/:id', routes.index);

app.get('/api/videos/:id', routes.videos.show);
app.post('/api/videos', routes.videos.create);

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
