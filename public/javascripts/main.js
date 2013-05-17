require.config({
  paths: {
    "hbs": "lib/hbs",
    "Handlebars": "lib/Handlebars",
    "Backbone": "lib/backbone",
    "underscore": "lib/underscore",
    "jquery": "lib/jquery",
    "bootstrap": "lib/bootstrap",
    "jquery.ui.widget": "lib/jquery.ui.widget",
    "jquery.fileupload": "lib/fileupload/jquery.fileupload",
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

// In order to make a single output file add in the dependencies all
// the dependencies (even those of submodules)
require(['jquery', 'Backbone', 'videos', 'hbs!template/videos/error', 'bootstrap',
            'hbs!template/videos/show', 'hbs!template/videos/form', 'hbs!template/videos/formFile',
            'jquery.ui.widget', 'jquery.fileupload', 'fileadder'], function($, Backbone, Videos) {

  /**
   * Change the last part of the title of the page
   */
  var changeTitle = function(newTitle) {
    var title = document.title.split('|');
    title[title.length - 1] = ' ' + newTitle;
    document.title = title.join('|');
  }

  /**
   * We define all our routes
   */
  var AppRouter = Backbone.Router.extend({
    routes: {
      "": "home",
      "videos/add": "showVideoForm",
      "videos/:id": "showVideo"
    },
    // When we change view we'll have to remove the previous one.
    // TODO: find a more elegant way to do this
    initialize: function() {
      this.currentView = null;
    },
    cleanView: function() {
      if (this.currentView) {
        this.currentView.remove();
        this.currentView = null;
      }
      return $('<div></div>');
    }
  });

  // Create the application
  var app_router = new AppRouter();
  // The callback to show the form to create a video
  app_router.on('route:showVideoForm', function() {
    var $view = app_router.cleanView();
    changeTitle("add video");
    app_router.currentView = new Videos.views.form({el: $view, model: new Videos.Model()});
    $("#content").html($view);

    app_router.currentView.on('postVideo', function(id) {
      app_router.navigate('videos/' + id, {trigger: true});
    });
  });

  // The callback to show a video
  app_router.on('route:showVideo', function(id) {
    var $view = app_router.cleanView();
    changeTitle("video " + id);

    var video = new Videos.Model({id:id});
    app_router.currentView = new Videos.views.normal({el: $view, model: video});
    $("#content").html($view);
    // We query the server for the video
    video.fetch({
      "error": function(e, res) {
        if (res.status === 404) {
          $('#content').html(errorTmpl({code:404}));
        } else {
          $('#content').html(errorTmpl({code:500, message:res.statusText}));
        }
      }
    });
  });

  // This is to avoid pages to be refreshed and instead navigate with backbone
  $('.bblink').click(function(e) {
    e.preventDefault();
    app_router.navigate($(this).attr('href'), {trigger: true});
  });

  // Start Backbone history a necessary step for bookmarkable URL's
  Backbone.history.start({pushState: true});
});
