/**
 * Mocks a http response in a really simple manner
 */
module.exports = function() {
  this.locals = {};
};

(function() {
  this.status = function(code) {
    this._status = code;
  };
  this.render = function(template, data) {
    this._template = template;
    this._data = data;
  };
  this.jsonp = function(code, data) {
    this._status = code;
    this._data = data;
  };
}).call(module.exports.prototype);
