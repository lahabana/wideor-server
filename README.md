Wideor server
===========================

# Install

All you need is included in the dependencies so the installation is quite straightforward

    git clone git@github.com:lahabana/wideor-server.git
    npm install
    # for the website
    npm run-script start-server # or node app.js
    # for the worker
    npm run-script start-worker # or node worker.js

# Environment variables:

You will need to set up some environment variables to make it work. (`export NAME="Value"`)

## General configuration

`WIDEOR_VERSION` The version you will run (if this is different from 'development' it will use release js and css from the bucket specified `WIDEOR_AWS_STATICBUCKET` so be sure this release exists on the bucket). If not set it uses development.

`WIDEOR_API_URL` This is to set the url of the API for the js (this is quite usefull to use a mock server for example http://wideorserver.apiary.io ;) ).

## Redis configuration

`WIDEOR_REDIS_HOST` The host of the redis server (if not set it will use 127.0.0.1) (this is necessary on both server and worker)

`WIDEOR_REDIS_PORT` The port of the redis server (if not set it will use 6379) (this is necessary on both server and worker)

`WIDEOR_REDIS_PREFIX` The name of the redis prefix where we'll store the jobs (this is necessary on both server and worker). We mean by prefix that all the keys in redis will be like: `prefix:id:whatever`.

## AWS Configuration

`WIDEOR_AWS_CLOUDFRONT_URL` the url to the cloudfront where the compiled css and js are stored (only on the server)

`WIDEOR_AWS_ACCESSKEYID` The access key id to upload to AWS (this is necessary on both server and worker)

`WIDEOR_AWS_SECRETACCESSKEY` The secret access key to AWS (this is necessary on both server and worker)

`WIDEOR_AWS_BUCKETVIDEO` The bucket where the videos once created are stored (only on the worker)

`WIDEOR_AWS_BUCKETIMAGE` The bucket where the uploaded images are stored (only on the server)

# Make a release

You shouldn't have to do this but making a release uses the script `make_release.sh`. This script will create a build directory and create compressed versions of the js and compile the style into a minified css file. Once this is done it will set the version in the npm package `npm version $NEW_VERSION`, upload the new static files to the s3 bucket and push the new version to the git repo. Usage:

    /scripts/make_release.sh x.y.z

> x.y.z needs to be greater than the current version otherwise it will refuse the new release.
> You will need s3cmd correctly configured to upload the static files
> you can optionnally specify `--no` followed by s3 and/or npm to avoid doing this part of the script

# Note on tests

To avoid the git repo to be to fat with a lot of test images all the test files are centralized in a s3 bucket. It uses for the moment s3cmd to download all the test images and generate the base videos (with the script generate_base.sh). Be careful the base images being generated do not mean that they are readable and correctly generated.

# TODO
- Merge the validation functions on the client side and on the server side
- See if we can remove the s3cmd from the release script and replace it with a custom node script (we already have knox-mpu as a dependency...)
- Split site and API because this is starting to be a real mess.
