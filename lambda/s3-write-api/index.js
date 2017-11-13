'use strict';

const config = require('./env.json'),
    Promise = require('bluebird'),
    AWS = require('aws-sdk'),
    bunyan = require('bunyan'),
    bformat = require('bunyan-format'),
    s3repo = require('./s3Repository'),
    exception = require('./exceptions');

const account = process.env.account;
const environment = config.environments[account];
const kinesis = new AWS.Kinesis({region: 'eu-west-1'});
const self = exports;
const lformat = bformat({outputMode: 'bunyan', levelInString: true});

const BadRequestException = exception.BadRequestException;
const NotAsArrayException = exception.NotAsArrayException;
const AttributeMissingException = exception.AttributeMissingException;

const log = bunyan.createLogger({
    name: 's3-write-api',
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
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,api-Key'
        },
        statusCode: statusCode
    };
}

function checkIfPayloadValid(event) {
    let methodName = "checkIfPayloadValid";
    if (event.body && isValidJson(event.body))
        return Promise.resolve(event);
    log.error({methodName: methodName, message: "Bad request: Payload is empty or invalid"});
    throw new BadRequestException();
}

function readInput(event) {
    let methodName = "readInput";
    let requestObject = {};
    let body = removeNewlineCharacters(event.body);
    requestObject.payload = JSON.parse(body);
    if (Array.isArray(requestObject.payload)) {
        return Promise.resolve(requestObject);
    }
    log.error({methodName: methodName, message: "Bad request: Payload should be array of event objects"});
    throw new NotAsArrayException();
}

function removeNewlineCharacters(str) {
    return str.replace(/\r?\n|\r/g, "");
}

function isValidJson(json) {
    try {
        JSON.parse(json);
    } catch (e) {
        return false;
    }
    return true;
}

function handleEvents(requestObject) {
    let methodName = "handleEvents";
    log.debug({requestObject: requestObject, "methodName": methodName}, "---- event received to put in s3");
    let promisesArray = [];
    requestObject.payload.map(item => {
        if (!item.hasOwnProperty('formId') || item.formId === "") { //formId is the name of S3 file
            log.error({methodName: methodName, message: "---- formId missing"});
            throw new AttributeMissingException();
        }
        promisesArray.push(putToS3(item, item.formId))
    });
    if (promisesArray.length > 0)
        return Promise.all(promisesArray);
    throw new BadRequestException();
}

function putToS3(singleEvent, basePath) {
    let methodName = "putToS3";
    let fileExtension = environment.s3.fileExtension;
    let path = basePath + fileExtension;
    return new Promise(function (resolve, reject) {
        let result = s3repo.save(environment.s3.bucketName, path, JSON.stringify(singleEvent));
        log.debug({
            event: singleEvent,
            "methodName": methodName
        }, " event written to s3 bucket '" + environment.s3.bucketName + "'");
        resolve(result);
    });
}

exports.handle = (event, context, callback) => {
    let methodName = "handle";
    log.debug({event: event, "methodName": methodName}, "---- event received");
    checkIfPayloadValid(event)
        .then(readInput)
        .then(handleEvents)
        .then(d => {
            callback(null, self.setResponse(202, {"code": 202, "message": "---- accepted for background processing"}));
            return d;
        })
        .catch(err => {
            let statusCode = err.statusCode ? err.statusCode : 404;
            let message = err.message ? err.message : err.stack;
            log.error(methodName + " error occurred: " + message);
            callback(null, self.setResponse(statusCode, {"exception": message}));
        });
};
