'use strict';

const { test_dest } = require('segment-sloth')
const { dest_payload } = require('./payload')

describe('Test destination function', function () {
  it('verifies successful response', async () => {
    const settings = {
    }

    // Testing destinations is less obvious than testing sources. Suggestions include stubbing the fetch function
    await test_dest(dest_payload, settings, <sam_port>)
  }).timeout(10000);
});
