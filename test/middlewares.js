/**
Copyright (c) 2013 Charly Molter

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
var assert = require('assert');
var middlewares = require('../middlewares');
var HttpError = require('http-error').HttpError;

/**
 * Mocks a http response in a really simple manner
 */
var MockRes = function() {
  this.locals = {};
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
}

describe('Checking errorHandler' , function() {
  it('with text error non xhr', function() {
    var res = new MockRes();
    middlewares.errorHandler("problem", {xhr: false}, res);
    assert.strictEqual(res._template, 'error');
    assert.strictEqual(res._status, 500);
    assert.strictEqual(res._data.title, "Wideor.it | 500 Error ");
    assert.strictEqual(res._data.message, "We don't know what happened here ;)");
  });

  it('with text error xhr', function() {
    var res = new MockRes();
    middlewares.errorHandler("problem", {xhr: true}, res);
    assert.ok(!res._template);
    assert.strictEqual(res._status, 500);
    assert.strictEqual(res._data.code, 500);
    assert.strictEqual(res._data.message, "We don't know what happened here ;)");
  });

  it('with normal error non xhr', function() {
    var res = new MockRes();
    middlewares.errorHandler(new Error("Oups"), {xhr: false}, res);
    assert.strictEqual(res._template, 'error');
    assert.strictEqual(res._status, 500);
    assert.strictEqual(res._data.title, "Wideor.it | 500 Error ");
    assert.strictEqual(res._data.message, "Oups");
  });

  it('with normal error xhr', function() {
    var res = new MockRes();
    middlewares.errorHandler(new Error("Oups"), {xhr: true}, res);
    assert.ok(!res._template);
    assert.strictEqual(res._status, 500);
    assert.strictEqual(res._data.code, 500);
    assert.strictEqual(res._data.message, "Oups");
  });

  it('with http-error non xhr', function() {
    var res = new MockRes();
    middlewares.errorHandler(new HttpError("Foo", 402), {xhr: false}, res);
    assert.strictEqual(res._template, 'error');
    assert.strictEqual(res._status, 402);
    assert.strictEqual(res._data.title, "Wideor.it | 402 Error ");
    assert.strictEqual(res._data.message, "Foo");
  });

  it('with http-error xhr', function() {
    var res = new MockRes();
    middlewares.errorHandler(new HttpError("Bar", 400), {xhr: true}, res);
    assert.ok(!res._template);
    assert.strictEqual(res._status, 400);
    assert.strictEqual(res._data.code, 400);
    assert.strictEqual(res._data.message, "Bar");
  });
});

describe('Checking notFound', function() {
  it('should return a correctly rendered response', function() {
    var res = new MockRes();
    middlewares.notFound({}, res);
    assert.strictEqual(res._template, '404');
    assert.strictEqual(res._status, 404);
    assert.strictEqual(res._data.title, "Wideor.it | 404 Not Found");
  });
});

describe('Checking jadeVariables', function() {
  it("should set versions, api_url and local js and css paths in development", function(done) {
    var mw = middlewares.jadeVariables({version: "development", apiUrl: "whatever"});
    assert.strictEqual(typeof(mw), "function");
    var res = new MockRes();
    mw({}, res, function() {
      assert.strictEqual(res.locals.app.api_url, "whatever");
      assert.strictEqual(res.locals.app.version, "development");
      assert.strictEqual(res.locals.app.js_url, "/javascripts/");
      assert.strictEqual(res.locals.app.css_url, "/stylesheets/");      
      done();
    });
  });

  it("should set versions, api_url and remote js and css paths in prod", function(done) {
    var mw = middlewares.jadeVariables({version: "x.x.x", apiUrl: "http://api.com", 
                                        aws: {cloudfront: "1234.cloudfront.com"}});
    assert.strictEqual(typeof(mw), "function");
    var res = new MockRes();
    mw({}, res, function() {
      assert.strictEqual(res.locals.app.api_url, "http://api.com");
      assert.strictEqual(res.locals.app.version, "x.x.x");
      assert.strictEqual(res.locals.app.js_url, "//1234.cloudfront.com/x.x.x");
      assert.strictEqual(res.locals.app.css_url, "//1234.cloudfront.com/x.x.x");      
      done();
    });
  });
});
