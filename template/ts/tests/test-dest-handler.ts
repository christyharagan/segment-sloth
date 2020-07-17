import { test_dest } from 'segment-sloth'
import { dest_payload } from './payload'

describe('Test destination function', function () {
  it('verifies successful response', async () => {
    const settings: FunctionSettings = {
    }
    
    // Testing destinations is less obvious than testing sources. Suggestions include stubbing the fetch function
    await test_dest(dest_payload, settings, <sam_port>)
  }).timeout(10000);
});
