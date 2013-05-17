/**
Copyright (c) 2013 Charly Molter

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// The autonomous worker that will take a job in the redis queue
// create the video and upload it to the s3
var redis = require('redis');
var jobberTrack = require('jobber-track');
var knox = require('knox');
var MultiPartUpload = require('knox-mpu');
var wideor = require('./wideor');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var config = require('./config');

var client = redis.createClient(config.redis.port,
                                config.redis.host,
                                "");
var S3 = knox.createClient({key: config.aws.key,
                                 secret: config.aws.secret,
                                 bucket: config.aws.bucket_video
                            });

var JobHandler = function(queue) {
  this.queue = new jobberTrack.Queue(client, config.redis.queue_name);
  EventEmitter.call(this);
};
util.inherits(JobHandler, EventEmitter);

// Make the stream upload directly to s3
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

// Start a new job
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

    // Add all the images to the video
    for (var i = 0; i < data.files.length; i++) {
      wid.add(data.files[i]);
    }
    wid.end();
  });
};

// launch a new job (this is a blocking call if no job exists it will block until one is exists)
JobHandler.prototype.launchJob = function() {
  console.log("Waiting for the next job");
  this.queue.popAndStart(this.startJob.bind(this));
};

// The actual worker
var jobHandler = new JobHandler();

var stop = false;
jobHandler.on('error', function(data) {
  console.error(data);
  stop = true;
  client.end();
});

// Once a job is finished we start the next one if we have not asked to quit
jobHandler.on('end', function(data) {
  if (!stop) {
    jobHandler.launchJob();
  } else {
    console.log("Finishing the program");
    client.end();
  }
});

// When we are connected to the redis client we start a new job
client.on('ready', function ready_redis() {
  console.log("Connected to redis client");
  // Launch the first job
  jobHandler.launchJob();
});

client.on('error', function error_redis() {
  console.error("Could not connect to redis server");
});
