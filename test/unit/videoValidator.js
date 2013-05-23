/**
Copyright (c) 2013 Charly Molter

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
var assert = require('assert');
var validator = require('../../routes/videoValidator');

describe('Checking validators.duration' , function() {
  it('with invalid strings, object...', function() {
    var tests = ["b", " ", "0", "-12", -12, {"a": "b"}, [2], NaN, Infinity, null];
    for (var i = 0; i < tests.length; i++) {
      var content = {};
      assert.ok(validator._validators.duration(tests[i], content));
      assert.deepEqual(content, {});
    }
  });

  it('with falsy values it will go to default', function() {
    var tests = ["", false, undefined];
    for (var i = 0; i < tests.length; i++) {
      var content = {};
      assert.ok(!validator._validators.duration(tests[i], content));
      assert.deepEqual(content, {"duration": 1});
    }
  });

  it('with valid values', function() {
    var tests = [1, 2, 5, "10", "1000", " 10"];
    for (var i = 0; i < tests.length; i++) {
      var content = {};
      assert.ok(!validator._validators.duration(tests[i], content));
      assert.deepEqual(content, {"duration": tests[i]});
      // We check we've changed strings into numbers
      assert.strictEqual(typeof(content.duration), "number");
    }
  });
});

describe('Checking validators.format' , function() {
  it('with invalid object, numbers...', function() {
    var tests = [12, {"a": "b"}, [2], null];
    for (var i = 0; i < tests.length; i++) {
      var content = {};
      assert.ok(validator._validators.format(tests[i], content));
      assert.deepEqual(content, {});
    }
  });

  it('with invalid strings', function() {
    var tests = ["b", " ", "0", "560xx333", "a540x340", "1x23x", "xxx", "x2x3", "0x0", "10a10"];
    for (var i = 0; i < tests.length; i++) {
      var content = {};
      assert.ok(validator._validators.format(tests[i], content));
      assert.deepEqual(content, {});
    }
  });

  it('with falsy values it will go to default', function() {
    var tests = ["", false, undefined];
    for (var i = 0; i < tests.length; i++) {
      var content = {};
      assert.ok(!validator._validators.format(tests[i], content));
      assert.deepEqual(content, {"format": "640x480"});
    }
  });

  it('with valid values', function() {
    var tests = ["1x1", "30x30", "12x35", "640x480", " 10000x10", "1x1 ", "1X10"];
    for (var i = 0; i < tests.length; i++) {
      var content = {};
      assert.ok(!validator._validators.format(tests[i], content));
      assert.deepEqual(content, {"format": tests[i].toLowerCase().trim()});
    }
  });
});

describe('Checking validators.files' , function() {
  it('with no files', function() {
    var content = {};
    assert.ok(validator._validators.files([], content));
    assert.deepEqual(content, {});
  });

  it('with other things than files objects', function() {
    var content = {};
    var tests = ["1", 2, undefined, null, false, {}];
    for (var i = 0; i < tests.length; i++) {
      assert.ok(validator._validators.files([tests[i]], content));
      assert.deepEqual(content, {});
    }

  });

  it('with files objects without format', function() {
    var content = {};
    assert.ok(validator._validators.files([{path:"http://google.com"}], content));
    assert.deepEqual(content, {});
  });

  it('with files objects with invalid paths', function() {
    var content = {};
    assert.ok(validator._validators.files([{path:"hoogle.com", format: 'jpeg'}], content));
    assert.deepEqual(content, {});

    assert.ok(validator._validators.files([{path:"", format: 'jpeg'}], content));
    assert.deepEqual(content, {});

    assert.ok(validator._validators.files([{path:"bgb:/jfjdje", format: 'jpeg'}], content));
    assert.deepEqual(content, {});
  });

  it('with invalid formats', function() {
    var content = {};
    assert.ok(validator._validators.files([{path:"http://google.com", format: 12}], content));
    assert.deepEqual(content, {});

    assert.ok(validator._validators.files([{path:"http://google.com", format: "tiff"}], content));
    assert.deepEqual(content, {});
  });

  it('with a single file and different Caps of the format', function() {
    var content = {};
    assert.ok(!validator._validators.files([{path:"http://google.com", format: "jpeg"}], content));
    assert.deepEqual(content, {"files": [{path:"http://google.com", format: "jpeg"}]});

    assert.ok(!validator._validators.files([{path:"http://google.com", format: "jpg"}], content));
    assert.deepEqual(content, {"files": [{path:"http://google.com", format: "jpeg"}]});

    assert.ok(!validator._validators.files([{path:"http://google.com", format: "JPG"}], content));
    assert.deepEqual(content, {"files": [{path:"http://google.com", format: "jpeg"}]});

    assert.ok(!validator._validators.files([{path:"http://google.com", format: "JPEG "}], content));
    assert.deepEqual(content, {"files": [{path:"http://google.com", format: "jpeg"}]});
  });

  it('with multiple files', function() {
    var content = {};
    assert.ok(!validator._validators.files([{path:"http://google.com ", format: "jpeg"},
                                            {path: " http://yahoo.com?ijigr=2", format: "jpeg"}], content));
    assert.deepEqual(content, {"files": [{path:"http://google.com", format: "jpeg"},
                                         {path: "http://yahoo.com?ijigr=2", format: "jpeg"}]});
  });
});

describe('Checking parseAndValidate' , function() {
  it('with everything to default', function() {
    var res = validator.parseAndValidate({"files": [{path:"http://google.com", format: "jpeg"},
                                            {path: "http://yahoo.com?ijigr=2", format: "jpeg"}]});
    assert.deepEqual(res, {"duration": 1, "format": "640x480",
                            "files": [{path:"http://google.com", format: "jpeg"},
                                    {path: "http://yahoo.com?ijigr=2", format: "jpeg"}]})
  });

  it('with everything specified', function() {
    var res = validator.parseAndValidate({"duration": 5, "format": "42x43",
                                          "files": [{path:"http://google.com", format: "jpeg"},
                                            {path: "http://yahoo.com?ijigr=2", format: "jpeg"}]});
    assert.deepEqual(res, {"duration": 5, "format": "42x43",
                            "files": [{path:"http://google.com", format: "jpeg"},
                                    {path: "http://yahoo.com?ijigr=2", format: "jpeg"}]})
  });

  it("throws on error", function(done) {
    try {
      assert.throws(validator.parseAndValidate({}), Error);
    } catch(e) {
      done();
    }
  });
});
