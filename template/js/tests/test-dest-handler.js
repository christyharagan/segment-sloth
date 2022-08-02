'use strict';

const { lambdaHandler } = require('../sam')
const { generate_dest_payload } = require('segment-sloth')
const { dest_payload } = require('./payload')

describe('Test destination function', function () {
  it('verifies successful response', async () => {
    const settings = {
    }
    
    const r = await lambdaHandler(generate_dest_payload(dest_payload, settings))
    expect(r.statusCode).toEqual(200)
  })
})
