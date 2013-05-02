require.config({
  paths: {
    "Handlebars": "lib/Handlebars",
    "Backbone": "lib/backbone",
    "underscore": "lib/underscore",
    "hbs": "lib/hbs",
    "jquery": "lib/jquery",
    "bootstrap": "//netdna.bootstrapcdn.com/twitter-bootstrap/2.3.1/js/bootstrap.min.js"
  },
  hbs: {
    disableI18n: true
  },
  shim: {
    "bootstrap": {
      deps: ["jquery"],
      exports: "$.fn.popover"
    },
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

  var changeTitle = function(newTitle) {
    var title = document.title.split('|');
    title[title.length - 1] = ' ' + newTitle;
    document.title = title.join('|');
  }

  var AppRouter = Backbone.Router.extend({
    routes: {
      "": "home",
      "videos/add": "showVideoForm",
      "videos/:id": "showVideo"
    }
  });

  var app_router = new AppRouter();
  app_router.on('route:showVideoForm', function(id) {
    changeTitle("add video");
    var videoView = new Videos.views.form({el: $("#content")});
    videoView.on('postVideo', function(id) {
      app_router.navigate('videos/' + id, {trigger: true});
    });
  });

  app_router.on('route:showVideo', function(id) {
    var video = new Videos.Model({id:id});
    changeTitle("video " + id);
    var videoView = new Videos.views.normal({el: $("#content"), model: video});
    video.fetch();
  });

  $('.bblink').click(function(e) {
    e.preventDefault();
    app_router.navigate($(this).attr('href'), {trigger: true});
  });

  // Start Backbone history a necessary step for bookmarkable URL's
  Backbone.history.start({pushState: true});
});
