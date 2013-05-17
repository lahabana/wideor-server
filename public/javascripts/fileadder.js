var deps = ['jquery', 'hbs!template/videos/formFile', 'jquery.ui.widget', 'jquery.fileupload'];
define("fileadder", deps, function($, formFileTmpl) {
  var FileAdder = function($fileAdder, size, duration) {
    this.size = size;
    this.duration = duration;
    this.$files = $fileAdder.find('.files');
    this.$adder = $fileAdder;
    this.queue = [];
    this.curJob = null;
    var that = this;
    $fileAdder.fileupload({
      dataType: 'json',
      sequentialUploads: true,
      add: function(e, data) {
        var $curFile = $(formFileTmpl({'upload':true, 'name': data.files[0].name,
                      'format': data.files[0].type.split('/')[1]}));
        start($curFile);
        that.$files.append($curFile);
        that.queue.push({data: data, obj: $curFile});
        that.next(false);
      }
    });
    _initUrlAdder.call(this);
  };

  var fail = function($el) {
    $el.find('.status').html('Failed')
      .data('status', 'failed')
      .removeClass('badge-warning')
      .addClass('badge-important');
  };

  var success = function($el, data) {
    $el.find('.status').html('Success')
          .data('status', 'success')
          .removeClass('badge-warning')
          .addClass('badge-success');
    $el.find('.file-url').val(data.path).attr('disabled', 'disabled');
    $el.find('.file-format').attr('disabled', 'disabled');
  };

  var start = function($el) {
    $el.find('.status').html('In Progress...')
      .data('action', '')
      .data('status', 'progress')
      .removeClass('badge-info')
      .addClass('badge-warning');
  };

  var _initUrlAdder = function() {
    var that = this;
    that.$adder.on('change', '.file-url', function(e) {
      var $this = $(this);
      var exts = $this.val().split('.');
      if (exts.length > 1) {
        $this.siblings('.file-format').val(exts[exts.length - 1]);
      }
    });

    that.$adder.on('click', 'button', function(e) {
      e.preventDefault();
      var $this = $(this);
      if($this.data("action") === "add") {
        that.$files.append(formFileTmpl({}));
      } else if ($this.data("action") === "remove") {
        $this.parent().remove();
      } else if ($this.data("action") === "start") {
        $this.data("action", "");
        var $parent = $this.parent();
        var $status = $parent.find('.status');
        start($parent);
        $.ajax({
          type: "POST",
          url: "/images?" + $.param({size: that.size}),
          dataType: 'json',
          data: {
            path: $parent.find('.file-url').val(),
            format: $parent.find('.file-format').val(),
            size: that.size
          }
        })
        .done(function(data) {
          success($parent, data);
        }).fail(function(data) {
          fail($parent, data);
        });
      }
    });
  };

  FileAdder.prototype.next = function(resetCurJob) {
    var that = this;
    if (resetCurJob) {
      that.curJob = null;
    }
    if (that.queue.length !== 0 && that.curJob === null) {
      that.curJob = that.queue.pop();
      var curJob = that.curJob;
      curJob.data.form.attr('action', "/images?" + $.param({size: that.size}));
      that.submit();
    }
  };

  FileAdder.prototype.submit = function() {
    var that = this;
    var $status = that.curJob.obj.find('.status');
    that.curJob.data.submit()
    .done(function(data) {
      success(that.curJob.obj, data);
    }).fail(function(data) {
      fail(that.curJob.obj, data);
    }).always(function(e, data) {
      that.next(true);
    });
  };

  FileAdder.prototype.isValid = function() {
    var res = true;
    this.$files.find('.status').each(function(idx, val) {
      var status = $(val).data("status");
      if (status !== "success") {
        res = false;
      }
    });
    return res;
  };

  FileAdder.prototype._getFiles = function() {
    var files = [];
    this.$files.find("li").each(function (idx, elt) {
      var url = $('.file-url', this).val().trim();
      var format = $('.file-format', this).val().trim();
      if (url !== '') {
        files.push({path: url, format: format});
      }
    });
    return files;
  };

  FileAdder.prototype.extractData = function() {
    return {
      format: this.size,
      duration: this.duration,
      files: this._getFiles()
    };
  }

  return FileAdder;
});
