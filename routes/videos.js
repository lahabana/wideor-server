var queue = null;

exports.setQueue = function(RedisQueue) {
  queue = RedisQueue;
}

exports.show = function(req, res) {
  res.render('show video', { title: 'Express' });
};

exports.create = function(req, res){
  res.render('create video', { title: 'Express' });
};
