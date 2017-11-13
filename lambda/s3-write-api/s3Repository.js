'use strict';

const aws = require('aws-sdk'),
    bunyan = require('bunyan'),
    strPromise = require('stream-to-promise');

const s3 = new aws.S3();
const log = bunyan.createLogger({
    name: 's3Repository'
});

class S3Repository {
    read(bucket, key) {
        let params = {
            Bucket: bucket,
            Key: key
        };

        let myReadStream = s3.getObject(params).createReadStream();
        return strPromise(myReadStream);
    }

    saveJson(bucket, key, data) {
        return new Promise((resolve, reject) => {
            s3.putObject({
                Bucket: bucket,
                Key: key,
                Body: new Buffer(JSON.stringify(data))
            }, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            })
        });
    }

    save(bucket, key, data) {
        return new Promise((resolve, reject) => {
            s3.putObject({
                Bucket: bucket,
                Key: key,
                Body: data
            }, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            })
        });
    }
}

module.exports = new S3Repository();
