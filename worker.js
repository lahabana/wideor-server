var redis = require('redis');
var jobberTrack = require('jobber-track');
var knox = require('knox');
var MultiPartUpload = require('knox-mpu');
var wideor = require('./wideor');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var client = redis.createClient(process.env.WIDEOR_REDIS_PORT || 6379,
                                process.env.WIDEOR_REDIS_HOST || "127.0.0.1",
                                "");
var S3 = knox.createClient({key: process.env.WIDEOR_AWS_ACCESSKEYID,
                                secret: process.env.WIDEOR_AWS_SECRETACCESSKEY,
                                bucket: process.env.WIDEOR_AWS_BUCKET
                            });

var JobHandler = function(queue) {
  this.queue = new jobberTrack.Queue(client, process.env.WIDEOR_QUEUE_NAME);
  EventEmitter.call(this);
};
util.inherits(JobHandler, EventEmitter);

var createS3Upload = function(stream, resource) {
  var that = this;
  var upload = new MultiPartUpload({
                client: S3,
                objectName: resource.id + '.mpeg', // Amazon S3 object name
                stream: stream,
                headers: {
                  'x-amz-acl': 'public-read'
                }
            }, function(err, res) {});

  upload.on('initiated', function(uploadId) {
    console.log("Job:" + resource.id, "Started with upload id:" + uploadId);
  });

  upload.on('completed', function(data) {
    console.log("Job:" + resource.id, "Finished upload", data.Location);
    resource.finish({url: data.Location}, function(err, reply) {
      if (err) {
        throw new Error("Job:" + resource.id + "Redis couldn't finish" + err);
      }
      console.log("Job:" + resource.id, "Finished on redis");
      that.emit('end');
    });
  });

  upload.on('error', function(err) {
    throw new Error("Job:" + resource.id + " S3 upload error" + JSON.stringify(err));
  });
};

JobHandler.prototype.startJob = function(err, res) {
  var that = this;
  if (err) {
    throw new Error(err);
  }
  that.queue.handler.get(res.id, function(err, resource) {
    if (err) {
      throw new Error("Job:" + res.id + " Redis error:" + res);
    }
    if (resource === null) {
      console.log("Job" + res.id, "Resource expired");
      that.emit('end');
      return;
    }
    console.log("Job:" + resource.id, "Starting");
    var data = resource.getValue().data;
    var wid = wideor.create({
      duration: data.duration,
      size: data.format
    });
    wid.on('consume', function(data) {
      console.log("Job:" + resource.id, "Consuming:", JSON.stringify(data));
    });
    wid.on('error', function(error) {
      console.error("Job:" + resource.id, "Wideor error:", error);
    });
    wid.stderr.setEncoding('utf8');
    wid.stderr.on('data', function(data) {
      console.log(data);
    });


    createS3Upload.call(that, wid.stdout, resource);
    for (var i = 0; i < data.files.length; i++) {
      wid.add(data.files[i]);
    }
    wid.end();
  });
};

JobHandler.prototype.launchJob = function() {
  console.log("Waiting for the next job");
  this.queue.popAndStart(this.startJob.bind(this));
};

var jobHandler = new JobHandler();

var stop = false;
jobHandler.on('error', function(data) {
  console.error(data);
  stop = true;
  client.end();
});

jobHandler.on('end', function(data) {
  if (!stop) {
    jobHandler.launchJob();
  } else {
    console.log("Finishing the program");
    client.end();
  }
});

client.on('ready', function ready_redis() {
  console.log("Connected to redis client");
  // Launch the first job
  jobHandler.launchJob();
});

client.on('error', function error_redis() {
  console.error("Could not connect to redis server");
});
