var jobberTrack = require('jobber-track');

/**
 * Mocks a queue
 */
module.exports = function() {
  this._resources = {};
  this.queue = [];
  this.makeFail = false;
  this.handler = new Handler(this);
};

Handler = function(queue) {
  this._queue = queue;
};

Handler.prototype.get = function(id, cb) {
  if (!this._queue._resources[id]) {
    return cb(false, null);
  }
  if (this._queue.makeFail) {
    return cb("Error get");
  }
  return cb(false, this._queue._resources[id]);
};

MockClient = function() {

};

MockClient.prototype.set = function(id, data, cb) {
  cb(false, "OK");
};

(function() {

  this.createAndPush = function(timeout, data, cb) {
    if (this.makeFail) {
      return cb("Error createAndPush");
    }
    var res = new jobberTrack.Resource(new MockClient(), (new Date()).getTime(), data);
    this.queue.push(res);
    this._resources[res.id] = res;
    cb(false, res);
  };

  this.popAndStart = function(cb) {
    throw new Error("not implemented yet")
  };

  this.__addResources = function(res) {
    for (var i = 0; i < res.length; i++) {
      this._resources[res[i].id] = new jobberTrack.Resource(new MockClient(), res[i].id, res[i].data);
    }
  };
}).call(module.exports.prototype);
