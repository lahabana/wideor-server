var reUrl = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/;

var isNumber = function(number) {
  if (typeof(number) !== "string" && typeof(number) !== "number") {
    return false;
  }
  return typeof(+number) === "number" && isFinite(+number) && !isNaN(+number);
};

var acceptedFormats = {
  "jpeg": "jpeg",
  "jpg": "jpeg"
};

// A validator is declared for each interesting field. It will
// parse the result validate it and transform it as necessary
// it etiher returns an error message or nothing and appends the correct data
// to the content object
var validators = {
  // Parse and validate each file
  files: function(files, content) {
    var res = [];
    var file;
    if (!files || files.length === 0) {
      return "You need to specify more than one file";
    }
    for (var i = 0; i < files.length; i++) {
      if (!files[i] || typeof(files[i]) !== "object") {
        return "files:" + i + "is not an object";
      }
      file = {
        format: typeof(files[i].format) === "string" ?
                  acceptedFormats[files[i].format.toLowerCase().trim()] : false,
        path: typeof(files[i].path) === "string" ? files[i].path.trim() : false
      };
      if (!file.path || !reUrl.test(file.path) || !file.format) {
        return "Each file needs a path and a supported format. This is" +
                  "not the case for file:" + i + "=" +
                  JSON.stringify(files[i]);
      }
      res.push(file);
    }
    content.files = res;
  },
  // parse and validate the format
  format: function(size, content) {
    if (size !== false && size !== '' && size !== undefined) {
      if (typeof(size) !== "string") {
        return "The format must be a string";
      }
      var format = (size + '').toLowerCase().split('x');
      if (format.length !== 2 || !isNumber(format[0]) || !isNumber(format[1]) ||
              (+format[0]) <= 0 || (+format[1]) <= 0) {
        return "The format must be a string of type [width]x[height]";
      }
      size = format[0].trim() + 'x' + format[1].trim();
    } else {
      size = "640x480";
    }
    content.format = size;
  },
  // parse and valid the duration of each image
  duration: function(duration, content) {
    if (duration !== false && duration !== '' && duration !== undefined) {
      if (!isNumber(duration) || duration <= 0) {
        return "The duration if specified needs to be a number greater than 0";
      } else {
        content.duration = +duration;
      }
    } else {
      content.duration = 1;
    }
  }
};
exports._validators = validators;

// Validate the data and create a valid json to be stored
var parseAndValidate = function(body) {
  var content = {};
  var err;
  // We launch each validators to check the entry is valid and append the result
  for (var i in validators) {
    if (validators.hasOwnProperty(i)) {
      err = validators[i](body[i], content);
      if (err) {
        throw new Error(err);
      }
    }
  }
  return content;
};
exports.parseAndValidate = parseAndValidate;
