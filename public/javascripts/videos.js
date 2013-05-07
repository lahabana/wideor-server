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
      if (!isNumber(data.duration) || data.duration <= 0) {
        return "The duration has to be a number";
      }
      var format = (data.format + '').toLowerCase().split('x');
      if (format.length !== 2 || !isNumber(format[0]) || !isNumber(format[1]) ||
            (+format[0]) <= 0 || (+format[1]) <= 0) {
        return "The dimensions of the video needs to be in the format [width]x[height]";
      }
      if (data.files.length === 0) {
        return "At least one file should be given";
      }
      for (var i = 0; i < data.files.length; i++) {
        var format = typeof(data.files[i].format) === "string" ?
                                supportedFormat[data.files[i].format.toLowerCase()] : null;
        if (!/:\/\//.test(data.files[i].path)) {
          data.files[i].path = 'http://' + data.files[i].path;
        }
        if (!reUrl.test(data.files[i].path)) {
          return data.files[i].path + " is not a valid url";
        }
        if (!format) {
          return data.files[i].format + " is not a supported format for file:" + data.files[i].path;
        }
        data.files[i].format = format;
      }
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
      this.fileAdder = new FileAdder($view.find(".file-adder"));
      this.model.on('invalid', function(model, error) {
        that.displayError(model.validationError);
      });
      that.$el.html($view);
    },
    events: {
      'click .submit': 'send'
    },
    displayError: function(error) {
      $err = this.$el.find('.error');
      $err.show().find('.content').html(error);
      $err.find('.close').one('click', function() {
        $err.hide();
      });
    },
    extractData: function() {
      return {
        duration: this.$el.find('#form-duration').val(),
        format: this.$el.find('#form-format').val(),
        files: this.fileAdder.getFiles()
      };
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
        that.model.save({data: that.extractData()}, {
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
