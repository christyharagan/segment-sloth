'use strict';

import { lambdaHandler } from '../sam'
import { generate_dest_payload } from 'segment-sloth'
import { dest_payload } from './payload'

describe('Test destination function', function () {
  it('verifies successful response', async () => {
    const settings = {
    }
    
    const r = await lambdaHandler(generate_dest_payload(dest_payload, settings))
    expect(r.statusCode).toEqual(200)
  })
})
