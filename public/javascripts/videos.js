/**
 * The model for a video and views for a form and displaying the video
 */

var deps = ['jquery', 'Backbone', 'fileadder', 'hbs!template/videos/show',
            'hbs!template/videos/form'];
define("videos", deps, function($, Backbone, FileAdder, showTmpl, formTmpl) {
  // A good function to check this is really a number
  var isNumber = function(number) {
    return typeof(+number) === "number" && isFinite(+number) && !isNaN(+number);
  };

  // Supported formats (can be used to clean user entered formats)
  var supportedFormat = {
    "jpg": "jpg",
    "jpeg": "jpg",
    "png": "png"
  };

  // A regexp to check a url is passed
  var reUrl = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;

  // Check that the duration and the size of the video are valid
  var validTopForm = function(data) {
    if (!isNumber(data.duration) || data.duration <= 0) {
      return "The duration has to be a number";
    }
    var format = (data.format + '').toLowerCase().split('x');
    if (format.length !== 2 || !isNumber(format[0]) || !isNumber(format[1]) ||
          (+format[0]) <= 0 || (+format[1]) <= 0) {
      return "The dimensions of the video needs to be in the format [width]x[height]";
    }
  };

  // Check all files are uploaded and have a valid url and size
  var validFiles = function(files) {
    if (files.length === 0) {
      return "At least one file should be given";
    }
    for (var i = 0; i < files.length; i++) {
      var format = typeof(files[i].format) === "string" ?
                          supportedFormat[files[i].format.toLowerCase()] : null;
      if (!/:\/\//.test(files[i].path)) {
        files[i].path = 'http://' + files[i].path;
      }
      if (!reUrl.test(files[i].path)) {
        return files[i].path + " is not a valid url";
      }
      if (!format) {
        return files[i].format + " is not a supported format for file:" + files[i].path;
      }
      files[i].format = format;
    }
  };

  /**
   * The model for a video
   */
  var model = Backbone.Model.extend({
    defaults: {
      data: {
        duration: 1,
        format: '640x480',
        files: []
      }
    },
    "urlRoot": "/api/videos/",
    validate: function(attributes, options) {
      var data = attributes.data;
      return validTopForm(data) || validFiles(data.files);
    }
  });

  var views = {};

  /**
   * View to display a video
   */
  views.normal = Backbone.View.extend({
    initialize: function() {
      //TODO check this is a correct way to do it
      this.listenTo(this.model, "change", this.render);
    },
    render: function() {
      this.$el.html(showTmpl(this.model.attributes));
    }
  });

  /**
   * View to display the form for the video
   */
  views.form = Backbone.View.extend({
    initialize: function() {
      this.render();
    },
    render: function() {
      var that = this;
      var $view = $(formTmpl(that.model.attributes.data));
      that.model.on('invalid', function(model, error) {
        that.displayError(model.validationError);
      });
      that.$el.html($view);
    },
    events: {
      'click .next': 'showFileAdder',
      'click .submit': 'send'
    },
    // show the second part of the form to add files
    showFileAdder: function(e) {
      e.preventDefault();

      var format = this.$el.find("#form-format").val();
      var duration = this.$el.find('#form-duration').val();
      // Check the first part of the form is valid
      var err = validTopForm({format: format, duration: duration});
      if (!err) {
        // Create the file adder that will handle upload to s3 etc.
        this.fileAdder = new FileAdder(this.$el.find(".file-adder"),
                                        format,
                                        duration);
        this.$el.find(".file-adder").show();
        this.$el.find(".submit").show();
        this.$el.find(".next").hide();
        this.$el.find(".main-form input").attr("disabled", "disabled");
        return;
      }
      this.displayError(err);
    },
    // Show the error message
    displayError: function(error) {
      $err = this.$el.find('.error');
      $err.show().find('.content').html(error);
      $err.find('.close').one('click', function() {
        $err.hide();
      });
    },
    isValid: function() {
      if (!this.fileAdder.isValid()) {
        this.displayError("Some of your uploads are either unfinished or failed. " +
                          "Please wait or remove the failed files");
        return false;
      }
      return true;
    },
    // Save the model and send the video (this should probably be moved to the "controller")
    send: function(e) {
      e.preventDefault();
      var that = this;
      if (that.isValid()) {
        that.model.save({data: that.fileAdder.extractData()}, {
          success: function (data) {
            that.trigger('postVideo', data.id);
          },
          error: function(e, data) {
            that.displayError("Server error please try again later");
          }
        });
      }
    }
  });
  return {Model: model, views: views};
});
