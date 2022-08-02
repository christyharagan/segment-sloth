'use strict';

import { lambdaHandler } from '../sam'
import { generate_dest_payload } from 'segment-sloth'
import { src_payload } from './payload'

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
