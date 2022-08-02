'use strict';

const { lambdaHandler } = require('../sam')
const { generate_dest_payload } = require('segment-sloth')
const { src_payload } = require('./payload')

describe('Test source function', function () {
  it('verifies successful response', async () => {
    const settings = {
    }

    const src_result = await lambdaHandler(generate_dest_payload(src_payload, settings))

    expect(src_result.tracks).to.be.an('array');
    expect(src_result.identifies).to.be.an('array');
    expect(src_result.screens).to.be.an('array');
    expect(src_result.pages).to.be.an('array');
    expect(src_result.aliases).to.be.an('array');
    expect(src_result.groups).to.be.an('array');
  })
})
