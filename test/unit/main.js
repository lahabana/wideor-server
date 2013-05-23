/**
Copyright (c) 2013 Charly Molter

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
/* We suspend this test for the moment
var wideor = require('../wideor.js');
var assert = require('assert');
var fs = require('fs');
var testFiles = './testFiles';
var checkFiles = './checkFiles';
var child = require('child_process');

var factory = function(options) {
  return function(data, cb) {
    var str = fs.createReadStream(data.path);
    var opts = {formatIn: data.format, size: options.size, formatOut: options.formatIn};
    wideor.plugConvert(str, opts, cb);
  };
};

var createTest = function(testDir) {
  return function(done) {
    var opts = testDir.split('_');
    var wid = wideor.create({
        duration: opts[1],
        codec: 'libx264',
        size: opts[0]
    }, factory);
    fs.readdir(testFiles + '/' + testDir, function(err, files) {
      for (var j = 0; j < files.length; j++) {
        var ext = files[j].split('.');
        if (ext[ext.length - 1] === 'jpg' || ext[ext.length - 1] === 'png') {
          wid.add({path: testFiles + '/' + testDir + '/' + files[j],
                   format: ext[ext.length - 1]});
        }
      }
      wid.end();
    });
    var res = '';
    var diff = child.spawn('diff', [checkFiles + '/' + testDir + '.mpeg', '-']);
    wid.stdout.pipe(diff.stdin);
    diff.stdout.setEncoding('utf-8');
    diff.stdout.on('data', function(data) {
      res += data;
    });
    diff.on('close', function() {
      assert.strictEqual(res, '');
      done();
    });
  };
};

describe('Checking videos are well created' , function() {
  var testDirs = fs.readdirSync(testFiles);
  for (var i = 0; i < testDirs.length; i++) {
    var stats = fs.statSync(testFiles + '/' + testDirs[i]);
    if (stats.isDirectory()) {
      it('generate the video' + testDirs[i] + '.mpeg', createTest(testDirs[i]));
    }
  }
});*/
