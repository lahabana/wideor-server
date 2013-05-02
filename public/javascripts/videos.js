var deps = ['jquery', 'Backbone', 'hbs!../templates/videos/show',
            'hbs!../templates/videos/form', 'hbs!../templates/videos/formFile'];
define(deps, function($, Backbone, showTmpl, formTmpl, formFileTmpl) {
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

  var displayError = function(container, error) {
    container.find('.error').show().find('.content').html(error);
  };
  views.normal = Backbone.View.extend({
    initialize: function() {
      this.listenTo(this.model, "change", this.render);
    },
    render: function() {
      this.$el.html(showTmpl(this.model.attributes));
    }
  });

  views.form = Backbone.View.extend({
    model: new model(),
    initialize: function() {
      this.render();
    },
    render: function() {
      var that = this;
      that.$el.html(formTmpl(this.model.attributes.data));
      var $fileAdder = $(".file-adder", this.$el);
      $fileAdder.on('change', '.file-url', function(e) {
        var $this = $(this);
        var exts = $this.val().split('.');
        if (exts.length > 1) {
          $this.siblings('.file-format').val(exts[exts.length - 1]);
        }
      });
      var $err = $('.error');
      $err.find('.close').on('click', function() {
        $err.hide();
      });
      $('.files', $fileAdder).append(formFileTmpl());

      $fileAdder.on('click', 'button', function(e) {
        e.preventDefault();
        if($(this).data("action") === "add") {
          $('.files', $fileAdder).append(formFileTmpl());
        } else if ($(this).data("action") === "remove") {
          $(this).parent().remove();
        }
      });
      this.model.on('invalid', function(model, error) {
        displayError(that.$el, model.validationError);
      });
    },
    events: {
      'click .submit': 'send'
    },
    extractData: function() {
      var data = {};
      data.duration = $('#form-duration', this.$el).val();
      data.format = $('#form-format', this.$el).val();
      data.files = [];
      $(".files li", this.$el).each(function (idx, elt) {
        var url = $('.file-url', this).val().trim();
        var format = $('.file-format', this).val().trim();
        if (url !== '') {
          data.files.push({path: url, format: format});
        }
      });
      return {data: data};
    },
    send: function(e) {
      e.preventDefault();
      var that = this;
      this.model.save(that.extractData(), {
        success: function (data) {
          that.trigger('postVideo', data.id);
        },
        error: function(e, data) {
          displayError(that.$el, "Server error please try again later");
        }
      });
    }
  });

  return {Model: model, views: views};
});
