'use strict';

const config = require('./env.json'),
    Promise = require('bluebird'),
    AWS = require('aws-sdk'),
    bunyan = require('bunyan'),
    bformat = require('bunyan-format'),
    strPromise = require('stream-to-promise');

const self = exports,
    s3 = new AWS.S3(),
    account = process.env.account,
    environment = config.environments[account],
    lformat = bformat({outputMode: 'bunyan', levelInString: true});

const log = bunyan.createLogger({
    name: 's3-read-api',
    stream: lformat,
    level: process.env.loglevel ? process.env.loglevel : 'DEBUG',
    message: {}
});

exports.setResponse = (statusCode, body) => {
    return {
        body: JSON.stringify(body),
        headers: {
            "Content-type": "application/json",
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,Api-Key'
        },
        statusCode: statusCode
    };
}

function getFormBuffer(event) {
    let methodName = "getFormBuffer";
    let s3FileName = event.pathParameters.formId;
    log.debug({methodName: methodName, formId: s3FileName}, "---- trying to fetch file from S3 Bucket");
    let params = {
        Bucket: environment.s3.bucketName,
        Key: s3FileName + environment.s3.fileExtension
    };
    let myReadStream = s3.getObject(params).createReadStream();
    log.debug({methodName: methodName}, "---- file buffer fetched from S3 Bucket");
    return strPromise(myReadStream);
}

function getLanguage(event) {
    let language = "";
    if (event.queryStringParameters && event.queryStringParameters.lang) {
        language = event.queryStringParameters.lang;
        return language;
    }
    language = "default_language";
    return language;
}

function getBufferObject(buffer) {
    if (buffer) {
        let bufferObject = JSON.parse(buffer);
        return Promise.resolve(bufferObject);
    }
    return Promise.reject({statusCode: 404, message: "no file found"});
}

function getS3Content(form, language) {
    let methodName = "getS3Content";
    if (form[language] && language !== "default_language") {
        log.debug({methodName: methodName, form: form, language: language}, "---- parsing json file");
        return form[language];
    }
    return form[form.default_language];
}

exports.handle = (event, ctx, cb) => {
    let methodName = "handle";
    log.debug({methodName: methodName, event: event}, "---- event received");
    getFormBuffer(event)
        .then(getBufferObject)
        .then(function (form) {
            let s3Content = getS3Content(form, getLanguage(event));
            cb(null, self.setResponse(200, s3Content));
        })
        .catch(err => {
            let statusCode = err.statusCode ? err.statusCode : 404;
            let message = err.message ? err.message : err;
            log.error(methodName + " error occurred: " + message);
            cb(null, self.setResponse(statusCode, {"error": message}));
        });
}
