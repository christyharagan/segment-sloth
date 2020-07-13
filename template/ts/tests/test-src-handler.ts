import { test_src } from 'segment-local-functions'
import { expect } from 'chai'
import { src_payload } from './payload'

describe('Test source function', function () {
  it('verifies successful response', async () => {
    const settings: FunctionSettings = {
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
