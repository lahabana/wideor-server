define('template/helpers/bootstrapCarousel', ['Handlebars', 'bootstrap'], function(Handlebars) {

  var bootstrapCarousel = function(items, options) {

    var start = '<div id="myCarousel" class="carousel slide">' ;
    var end = '<div class="carousel-nb">' + items.length + ' Images</div>' +
              '<a class="carousel-control left" href="#myCarousel" data-slide="prev">&lsaquo;</a>' +
              '<a class="carousel-control right" href="#myCarousel" data-slide="next">&rsaquo;</a>' +
              '</div>'

    var carouselItems = '<div class="carousel-inner">';
    for (var i = 0, l = items.length; i < l; i++) {
      carouselItems += '<div class="item ' + (i === 0 ? 'active' : '') + '">'
                        + options.fn(items[i]) + '</div>';
    }
    carouselItems += '</div>';

    return start + carouselItems + end;
  };

  Handlebars.registerHelper('bootstrapCarousel', bootstrapCarousel);

  return bootstrapCarousel;
});
