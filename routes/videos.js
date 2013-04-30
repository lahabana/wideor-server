
exports.show = function(req, res){
  res.render('show video', { title: 'Express' });
};

exports.create = function(req, res){
  res.render('create video', { title: 'Express' });
};
