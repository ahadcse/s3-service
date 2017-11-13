'use strict';

const chai = require('chai'),
    should = chai.should(),
    lambdaLocal = require('lambda-local'),
    chaiAsPromised = require("chai-as-promised"),
    mute = require("mute");

chai.use(chaiAsPromised);
chai.should();

describe('s3-read-api', function () {

    this.timeout(15000);

    it('should return a valid json file', function () {
        let unmute = mute();
        let event = require("./data/valid_event.json");
        let expectedResponse = require('./data/valid_response.json');
        return invokeLambda(event)
            .then(function (response) {
                unmute();
                return response.should.deep.equal(expectedResponse);

            });

    });

    it('should return a form not found', function () {
        let unmute = mute();
        let event = require("./data/non_existing_file.json");
        let expectedResponse = require('./data/response_not_found.json');
        return invokeLambda(event)
            .then(function (response) {
                unmute();
                return response.should.deep.equal(expectedResponse);
            });
    });
});

function invokeLambda(event) {
    return lambdaLocal.execute({
        event: event,
        profileName: 'dev',
        lambdaHandler: "handle",
        lambdaPath: "index.js",
        profile: "dev"
    });
}
