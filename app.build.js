({
    appDir: "public/javascripts",
    baseUrl: ".",
    dir: "build",
    //Comment out the optimize line if you want
    //the code minified by UglifyJS.
    optimize: "none",
    modules: [
        {
            name: "main"
        }
    ],
    mainConfigFile: 'public/javascripts/main.js'
})
