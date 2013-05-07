// This file describes all the configuration variables just require it
// when you need to access global variables
module.exports = {
  version: process.env.WIDEOR_VERSION || "development",
  port: process.env.PORT || 3000,
  redis: {
    port: process.env.WIDEOR_REDIS_PORT || 6379,
    host: process.env.WIDEOR_REDIS_HOST || "127.0.0.1",
    queue_name: process.env.WIDEOR_QUEUE_NAME
  },
  aws: {
    cloudfront: process.env.WIDEOR_AWS_CLOUDFRONT_URL,
    key: process.env.WIDEOR_AWS_ACCESSKEYID,
    secret: process.env.WIDEOR_AWS_SECRETACCESSKEY,
    bucket_video: process.env.WIDEOR_AWS_BUCKETVIDEO,
    bucket_image: process.env.WIDEOR_AWS_BUCKETIMAGE
  }
};
