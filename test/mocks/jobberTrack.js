var jobberTrack = require('jobber-track');


var Resource = function(data) {
  if (data.id) {
    this.id = data.id;
  }
  this.data = data.data || {};
  this.result = data.result || {};
  this.state = data.state || "waiting";
};

Resource.prototype.serialize = function() {
  return {
    id: this.id,
    data: this.data,
    result: this.result,
    state: this.state
  };
};

/**
 * Mocks a queue
 */
var Queue = function() {
  this._resources = {};
  this.queue = [];
  this.makeFail = false;
  this.index = 0;
};

(function() {
  this.createAndPush = function(data, cb) {
    if (this.makeFail) {
      return cb("Error createAndPush");
    }
    this.index++;
    var res = new Resource({id: this.index, data:data});
    this.queue.push(res.id);
    this._resources[res.id] = res;
    cb(false, res.id);
  };

  this.popAndStart = function(cb) {
    throw new Error("not implemented yet");
  };

  this.__addResources = function(res) {
    for (var i = 0; i < res.length; i++) {
      this._resources[res[i].id] = new Resource(res[i]);
    }
  };

  this.get = function(id, cb) {
  if (!this._resources[id]) {
    return cb(false, null);
  }
  if (this.makeFail) {
    return cb("Error get");
  }
  return cb(false, this._resources[id]);
};
}).call(Queue.prototype);


module.exports = function(client, hash, callback) {
  callback(false, new Queue());
}
