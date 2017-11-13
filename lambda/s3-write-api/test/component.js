'use strict';

const chai = require('chai'),
    should = chai.should(),
    lambdaLocal = require('lambda-local'),
    chaiAsPromised = require("chai-as-promised"),
    mute = require("mute"),
    assert = require('assert');

chai.use(chaiAsPromised);
chai.should();

describe('s3-write-api', function () {

    this.timeout(15000);

    it('should return a valid response', function () {
        let unmute = mute();
        let event = require("./events/event.json");
        return invokeLambda(event)
            .then(function (response) {
                unmute();
                assert(response.statusCode == 202);
            });

    });

    it('should return bad request exception: Empty or invalid payload', function () {
        let unmute = mute();
        let event = require("./events/bad_event.json");
        return invokeLambda(event)
            .then(function (response) {
                unmute();
                let exception = JSON.parse(response.body);
                assert(response.statusCode == 400)
                assert(exception.exception == "Bad Request: Empty or invalid payload")
            });
    });
});

function invokeLambda(event) {
    return lambdaLocal.execute({
        event: event,
        profileName: 'dev',
        lambdaHandler: "handle",
        lambdaPath: "index.js",
        profile: "dev",
        environment: {'account': 'dev'}
    });
}
