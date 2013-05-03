#!/bin/bash

## This script will create a release and upload all the static files to the s3


## We all love so for this kind of things: http://stackoverflow.com/questions/3511006/how-to-compare-versions-of-some-products-in-unix-shell
compareVersions ()
{
  typeset    IFS='.'
  typeset -a v1=( $1 )
  typeset -a v2=( $2 )
  typeset    n diff

  for (( n=0; n<3; n+=1 )); do
    diff=$((v1[n]-v2[n]))
    if [ $diff -ne 0 ] ; then
      [ $diff -lt 0 ] && echo '-1' || echo '1'
      return
    fi
  done
  echo  '0'
} # ----------  end of function compareVersions  ----------

RE_VERSION='[0-9]+\.[0-9]+\.[0-9]+'

if [ $# -ne 1 ]; then
  echo "You need to pass in a version number"
  exit -1
fi
if [[ ! "$1" =~ [0-9]+\.[0-9]+\.[0-9]+ ]]; then
  echo "The version number passed is invalid"
  exit -1
fi

# Extract our versions
NEW_VERSION=$1
CUR_VERSION=$(npm "version" | grep "wideor-server" | egrep -o '[0-9]+\.[0-9]+\.[0-9]+')

if [ $(compareVersions "$NEW_VERSION" "$CUR_VERSION") -ne 1 ]; then
  echo "The new version needs to be greated that the current one"
  exit -1
fi

# Create the directory where we'll put all the files generated
if [ ! -d "build" ]; then
  mkdir build
fi
npm install
npm test
# We deal with the js files
r.js -o app.build.js
# Top of the pops would be to add gz compression
uglifyjs build/main.js -c -m -o build/main.min.js
uglifyjs build/require.js -c -m -o build/require.min.js
# Now with the css
lessc  public/stylesheets/style.less  --yui-compress build/style.css

s3cmd put --acl-public --add-header='Expires: Sat, 20 Nov 2286 18:46:39 GMT' \
          --guess-mime-type build/style.css \
          s3://"$WIDEOR_AWS_STATICBUCKET"/"$NEW_VERSION"style.css
s3cmd put --acl-public --add-header='Expires: Sat, 20 Nov 2286 18:46:39 GMT' \
          --guess-mime-type build/require.min.js \
          s3://"$WIDEOR_AWS_STATICBUCKET"/"$NEW_VERSION"require.js
s3cmd put --acl-public --add-header='Expires: Sat, 20 Nov 2286 18:46:39 GMT' \
          --guess-mime-type build/main.min.js \
          s3://"$WIDEOR_AWS_STATICBUCKET"/"$NEW_VERSION"main.js

npm version "$VERSION"
