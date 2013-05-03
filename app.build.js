({
    appDir: "public/javascripts",
    baseUrl: ".",
    dir: "build",
    //Comment out the optimize line if you want
    //the code minified by UglifyJS.
    optimize: "none",

    paths: {
        "hbs": "lib/hbs",
        "jquery": "lib/jquery",
        "Handlebars": "lib/Handlebars",
        "Backbone": "lib/backbone",
        "underscore": "lib/underscore",
        "bootstrap": "lib/bootstrap"
    },
    modules: [
        {
            name: "main"
        }
    ],
    hbs: {
        disableI18n: true
    },
    findNestedDependencies: true,
    shim: {
        "bootstrap": {
          deps: ["jquery"],
          exports: "$.fn.popover"
        },
        underscore: {
          exports: '_'
        },
        'Handlebars': {
          exports: 'Handlebars'
        },
        Backbone: {
          deps: ["underscore", "jquery"],
          exports: "Backbone"
        }
    }
})
