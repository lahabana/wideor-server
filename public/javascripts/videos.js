var deps = ['jquery', 'Backbone', 'fileadder', 'hbs!template/videos/show',
            'hbs!template/videos/form'];
define("videos", deps, function($, Backbone, FileAdder, showTmpl, formTmpl) {
  var isNumber = function(number) {
    return typeof(+number) === "number" && isFinite(+number) && !isNaN(+number);
  };

  var supportedFormat = {
    "jpg": "jpg",
    "jpeg": "jpg",
    "png": "png"
  };

  var reUrl = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;

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

  views.normal = Backbone.View.extend({
    initialize: function() {
      this.listenTo(this.model, "change", this.render);
    },
    render: function() {
      this.$el.html(showTmpl(this.model.attributes));
    }
  });

  views.form = Backbone.View.extend({
    initialize: function() {
      this.render();
    },
    render: function() {
      var that = this;
      var $view = $(formTmpl(this.model.attributes.data));
      this.model.on('invalid', function(model, error) {
        that.displayError(model.validationError);
      });
      that.$el.html($view);
    },
    events: {
      'click .next': 'showFileAdder',
      'click .submit': 'send'
    },
    showFileAdder: function(e) {
      var format = this.$el.find("#form-format").val();
      var duration = this.$el.find('#form-duration').val();
      e.preventDefault();
      var err = validTopForm({format: format, duration: duration});
      if (!err) {
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
    send: function(e) {
      e.preventDefault();
      var that = this;
      if (that.isValid()) {
        that.model.save({data: this.fileAdder.extractData()}, {
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
