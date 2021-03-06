// This file describes all the configuration variables just require it
// when you need to access global variables
var conf = {
  version: process.env.WIDEOR_VERSION || "development",
  apiUrl: process.env.WIDEOR_API_URL || '',
  port: process.env.PORT || 3000,
  redis: {
    port: process.env.WIDEOR_REDIS_PORT || 6379,
    host: process.env.WIDEOR_REDIS_HOST || "127.0.0.1",
    prefix: process.env.WIDEOR_REDIS_PREFIX || "wideor"
  },
  aws: {
    cloudfront: process.env.WIDEOR_AWS_CLOUDFRONT_URL,
    key: process.env.WIDEOR_AWS_ACCESSKEYID,
    secret: process.env.WIDEOR_AWS_SECRETACCESSKEY,
    bucket_video: process.env.WIDEOR_AWS_BUCKETVIDEO,
    bucket_image: process.env.WIDEOR_AWS_BUCKETIMAGE
  }
};

module.exports = conf;
