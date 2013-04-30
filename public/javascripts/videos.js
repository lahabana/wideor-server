define(['jquery', 'Backbone', 'hbs!../templates/videos/show'], function($, Backbone, showTmpl) {
  var model = Backbone.Model.extend({
    "url": "/videos/"
  });

  var views = {};
  views.normal = Backbone.View.extend({

  });

  return {Model: model, views: views};
});
