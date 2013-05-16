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
        that.$files.append($curFile);
        that.queue.push({data: data, obj: $curFile});
        that.next(false);
      }
    });
    _initUrlAdder.call(this);
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
        $status.html('In Progress...')
                .data('status', 'success')
                .removeClass('badge-info')
                .addClass('badge-warning');
        $.ajax({
          type: "POST",
          url: "/images",
          dataType: 'json',
          data: JSON.stringify({
            path: $parent.find('.file-url').val(),
            format: $parent.find('.file-format').val(),
            size: that.size
          })
        }).done(function(data) {
          $status.html('Success')
                .data('status', 'success')
                .removeClass('badge-warning')
                .addClass('badge-success');
          $parent.find('.file-url').val(data.path).attr('disabled', 'disabled');
          $parent.find('.file-format').attr('disabled', 'disabled');
        }).fail(function(e, data) {
          $status.html('Failed')
                .data('status', 'failed')
                .removeClass('badge-warning')
                .addClass('badge-important');
        });
      }
    });
  }

  FileAdder.prototype.next = function(resetCurJob) {
    var that = this;
    if (resetCurJob) {
      that.curJob = null;
    }
    if (that.queue.length !== 0 && that.curJob === null) {
      that.curJob = that.queue.pop();
      var curJob = that.curJob;
      curJob.data.formData = [
        {name: "size", value: that.size}
      ];
      curJob.data.form.attr('action', "/images");
      that.submit();
    }
  };

  FileAdder.prototype.submit = function() {
    var that = this;
    that.curJob.data.submit().done(function(data) {
      that.curJob.obj.find('.status').html('Success')
                              .data('status', 'success')
                              .removeClass('badge-warning')
                              .addClass('badge-success');
      that.curJob.obj.find('.file-url').val(data.path);
    }).fail(function(e, data) {
      that.curJob.obj.find('.status').html('Failed')
                              .data('status', 'failed')
                              .removeClass('badge-warning')
                              .addClass('badge-important');
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
      size: this.size,
      duration: this.duration,
      files: this._getFiles()
    };
  }

  return FileAdder;
});
