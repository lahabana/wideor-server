var deps = ['jquery', 'hbs!template/videos/formFile', 'jquery.ui.widget', 'jquery.fileupload'];
define("fileadder", deps, function($, formFileTmpl) {
  var FileAdder = function($fileAdder) {
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
      $.getJSON("/s3auth?" + $.param({"content_type": curJob.data.files[0].type}), function(aws) {
        curJob.data.form.attr('action', 'https://' + aws.bucket + '.s3.amazonaws.com/');
        curJob.data.formData = [
          {name:"bucket", value: aws.bucket},
          {name:"key", value: aws.key},
          {name:"Content-Type", value: aws.content_type},
          {name:"AWSAccessKeyId", value: aws.access_key_id},
          {name:"acl", value: aws.acl},
          {name:"policy", value: aws.policy},
          {name:"signature", value: aws.signature}
        ];
        that.submit('https://' + aws.bucket + '.s3.amazonaws.com/' + aws.key);
      });
    }
  };

  FileAdder.prototype.submit = function(filename) {
    var that = this;
    that.curJob.data.submit().done(function(e, data) {
      that.curJob.obj.find('.status').html('Success')
                              .data('status', 'success')
                              .removeClass('badge-warning')
                              .addClass('badge-success');
      that.curJob.obj.find('.file-url').val(filename);
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
      if (status === "failed" || status === "waiting") {
        res = false;
      }
    });
    return res;
  };

  FileAdder.prototype.getFiles = function() {
    var files = [];
    this.$files.find("li").each(function (idx, elt) {
      var url = $('.file-url', this).val().trim();
      var format = $('.file-format', this).val().trim();
      if (url !== '') {
        files.push({path: url, format: format});
      }
    });
    return files;
  }

  return FileAdder;
});
