/**
Copyright (c) 2013 Charly Molter

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
var assert = require('assert');
var jobberTrack = require('../../mocks/jobberTrack');
var videos = require('../../../routes/videos');
var MockRes = require('../../mocks/response');
var HttpError = require('http-error').HttpError;

beforeEach(function(done) {
  jobberTrack(undefined, undefined, function(err, q) {
    q.__addResources([
      {id: 1, data: "data1"},
      {id: 2, data: "data2"},
      {id: 3, data: "data3"}
    ]);
    videos.setTracker(q);
    done();
  });
});

describe('Checking show()' , function() {

  it('with an existing video', function() {
    var res = new MockRes();
    videos.show({ xhr: true, params: {id: 1}}, res, function(err) {
      //check this is never triggered
      assert.ok(false);
    });
    assert.strictEqual(res._status, 200);
    assert.deepEqual(res._data, {id: 1, data: "data1", result: {}, state: "waiting"});
  });

  it('with a non existing video', function(done) {
    var res = new MockRes();
    videos.show({ xhr: true, params: {id: 5}}, res, function(err) {
      assert.ok(err instanceof HttpError);
      assert.strictEqual(err.code, 404);
      done();
    });
  });

  it('with forcing an internal error', function(done) {
    var res = new MockRes();
    videos.getTracker().makeFail = true;
    videos.show({ xhr: true, params: {id: 1}}, res, function(err) {
      assert.ok(err instanceof HttpError);
      assert.strictEqual(err.code, 500);
      assert.strictEqual(err.message, "Error get");
      done();
    });
  });

  it('without id param', function(done) {
    var res = new MockRes();
    videos.getTracker().makeFail = true;
    videos.show({ xhr: true, params: {}}, res, function(err) {
      assert.ok(err instanceof HttpError);
      assert.strictEqual(err.code, 400);
      done();
    });
  });
});


describe('Checking create()' , function() {
  it('with a correct content and req.body', function() {
    var res = new MockRes();
    videos.create({ xhr: true, body: {files: [{path: "http://google.com", format: "jpeg"}]}},
                  res, function(err) {
      //check this is never triggered
      assert.ok(false);
    });
    assert.strictEqual(res._status, 201);
    assert.ok(res._data.id);
  });

  it('with a correct content and req.body.data', function() {
    var res = new MockRes();
    videos.create({ xhr: true, body: {data: {files: [{path: "http://google.com", format: "jpeg"}]}}},
                    res, function(err) {
      //check this is never triggered
      assert.ok(false);
    });
    assert.strictEqual(res._status, 201);
    assert.ok(res._data.id);
  });

  it('with wrong data', function(done) {
    var res = new MockRes();
    videos.create({ xhr: true, body: {data: {files: []}}}, res, function(err) {
      assert.ok(err instanceof HttpError);
      assert.strictEqual(err.code, 400);
      done();
    });
  });

  it('with forcing an error', function(done) {
    var res = new MockRes();
    videos.getTracker().makeFail = true;
    videos.create({ xhr: true, body: {data: {files: [{format: "jpeg", path: "http://google.com"}]}}},
                    res, function(err) {
      assert.ok(err instanceof HttpError);
      assert.strictEqual(err.code, 500);
      assert.strictEqual(err.message, "Error createAndPush");
      done();
    });
  });
});
