var crypto = require('crypto');
var config = require('../config');

exports.index = function(req, res) {
  res.render('index', { title: 'Wideor.it | home'});
};

exports.empty = function(req, res) {
  res.render('layout', { title: 'Wideor.it | '});
};

exports.about = function(req, res) {
  res.render('about', { title: 'Wideor.it | about' });
};

exports.s3Auth = function(req, res) {
  var content_type = req.param("content_type", null);
  var s3 = {
    access_key_id: config.aws.key,
    secret_key: config.aws.secret,
    bucket: config.aws.bucket_image,
    acl: "public-read",
    key: new Date().getTime() + '.' + content_type.split('/')[1],
    pad: function(n) {
      if ((n+"").length == 1) {
        return "0" + n;
      }
      return ""+n;
    },
    expiration_date: function() {
      var now = new Date();
      var date = new Date(now.getTime() + 3600);
      var ed = date.getFullYear() + "-" + this.pad(date.getMonth()+1) + "-" + this.pad(date.getDate());
      ed += "T" + this.pad(date.getHours()) + ":" + this.pad(date.getMinutes()) +
            ":" + this.pad(date.getSeconds()) + ".000Z";
      return ed;
    }
  };

  var expiry_date = s3.expiration_date();
  var signatureString = "{\n    'expiration': '" + expiry_date + "',\n"
      + "   'conditions': [\n"
      + "       {'bucket': '" + s3.bucket + "'},"
      + "       {'key': '" + s3.key + "'},"
      + "       {'acl': '" + s3.acl + "'},"
      + "       {'Content-Type': '" + content_type + "'}\n ]\n}";

  var policy = new Buffer(signatureString).toString('base64').replace(/\n|\r/, '');
  var hmac = crypto.createHmac("sha1", s3.secret_key);
  var hash2 = hmac.update(policy);
  var signature = hmac.digest(encoding="base64");

  return res.jsonp(200, {
    content_type: content_type,
    bucket: s3.bucket,
    key: s3.key,
    acl: s3.acl,
    access_key_id: s3.access_key_id,
    policy: policy,
    signature: signature
  });
};

exports.videos = require('./videos.js');
