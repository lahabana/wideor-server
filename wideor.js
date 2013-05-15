/**
Copyright (c) 2013 Charly Molter

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var stroem = require('stroem-kid');
var child = require('child_process');
var fs = require('fs');
var request = require('request');

var wideor = {};
wideor.factory = function(options) {
  return function(data, cb) {
      var opts = {formatIn: data.format, size: options.size, formatOut: options.formatIn};
      wideor.plugConvert(request(data.path), opts, cb);
  };
};

wideor.plugConvert = function(stream, opts, cb) {
  var convert = child.spawn('convert', [opts.formatIn + ':fd:0', '-background', opts.bg || '#000000',
                                        '-resize', opts.size, '-gravity', 'center', '-extent', opts.size,
                                        '-strip', '-sampling-factor', '4:2:0', '-type', 'TrueColor',
                                        'jpeg:-']);
  stream.pipe(convert.stdin);
  cb(false, convert.stdout);
};

var extractOptions = function(options) {
  var opts = {
    duration: 1,
    codec: 'libx264',
    size: '640x480',
    fps: 20
  };
  for (var i in opts) {
    if (opts.hasOwnProperty(i) && options[i]) {
      opts[i] = options[i];
    }
  }
  return opts;
};

wideor.create = function(options, factory) {
  var opts = extractOptions(options);
  var strm = stroem.spawn('avconv', ['-f', 'image2pipe', '-r', '1/' + opts.duration,
                                      '-c:v', 'mjpeg', '-i', '-', '-vcodec', 'libx264', '-r',
                                      opts.fps, '-f', 'mpegts', '-'],
                          {}, factory ? factory(opts) : wideor.factory(opts));
  return strm;
};

module.exports = wideor;
