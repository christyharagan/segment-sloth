'use strict';

const { test_src } = require('segment-local-functions')
const { src_payload } = require('./payload')
const chai = require('chai');
const expect = chai.expect;

const src_payload = {
  "body": {
    "message": "Hello World"
  },
  "headers": {},
  "queryParameters": {}
}

describe('Test source function', function () {
  it('verifies successful response', async () => {
    const settings = {
    }

    const src_result = await test_src(src_payload, settings, <sam_port>)

    expect(src_result.tracks).to.be.an('array');
    expect(src_result.identifies).to.be.an('array');
    expect(src_result.screens).to.be.an('array');
    expect(src_result.pages).to.be.an('array');
    expect(src_result.aliases).to.be.an('array');
    expect(src_result.groups).to.be.an('array');
  }).timeout(10000);
});
