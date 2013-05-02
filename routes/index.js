
/*
 * GET home page.
 */

exports.index = function(req, res) {
  res.render('index', { title: 'Wideor.it | home'});
};

exports.empty = function(req, res) {
  res.render('layout', { title: 'Wideor.it | '});
};

exports.about = function(req, res) {
  res.render('about', { title: 'Wideor.it | about' });
};

exports.videos = require('./videos.js');
