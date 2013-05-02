#!/bin/bash

## This script will create a release and upload all the static files to the s3

# Create the directory where we'll put all the files generated
if [ ! -d "build" ]; then
  mkdir build
fi;
npm install
npm test
# We deal with the js files
r.js -o app.build.js
# Top of the pops would be to add gz compression
uglifyjs build/main.js -o build/main.min.js

# Now with the css
lessc  public/stylesheets/style.less  --yui-compress build/style.css

