require.config({
  paths: {
    "Handlebars": "lib/Handlebars",
    "Backbone": "lib/backbone",
    "underscore": "lib/underscore",
    "hbs": "lib/hbs",
    "jquery": "lib/jquery"
  },
  hbs: {
    disableI18n: true
  },
  shim: {
    underscore: {
      exports: '_'
    },
    'Handlebars': {
      exports: 'Handlebars'
    },
    Backbone: {
      deps: ["underscore", "jquery"],
      exports: "Backbone"
    }
  }
});

require(['jquery', 'Backbone', 'videos'], function($, Backbone, Videos) {

  var AppRouter = Backbone.Router.extend({
    routes: {
      "": "home",
      "videos/:id": "showVideo"
    }
  });

  var app_router = new AppRouter();
  app_router.on('route:showVideo', function(id) {
    var video = new Videos.Model({id:id});
    video.fetch({
      success: function (video) {
        var video = new Videos.views.normal({el: $("#content"), model: video});
      }
    });
  });

  app_router.on('route:home', function(id) {
    el: $('#content').html("hoy");
  });

  $('.bblink').click(function(e) {
    e.preventDefault();
    app_router.navigate($(this).attr('href'), {trigger: true});
  });

  // Start Backbone history a necessary step for bookmarkable URL's
  Backbone.history.start({pushState: true});
});
