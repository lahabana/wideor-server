define('template/helpers/renderState', ['Handlebars'], function(Handlebars) {

  var hash = {
    'finished': { "class":'label-success', "string": "Finished"},
    'failed': { "class":'label-important', "string": "Failed"},
    'waiting': { "class":'label-info', "string": "Waiting"},
    'running': { "class":'label-warning', "string": "Running"}
  };

  var renderState = function (context) {
    if (hash[context]) {
      return new Handlebars.SafeString('<div class="label state ' + hash[context]['class'] + '"> State: ' + 
                                        hash[context]['string'] + '</div>');
    }
  };

  Handlebars.registerHelper('renderState', renderState);
  return renderState;

});
