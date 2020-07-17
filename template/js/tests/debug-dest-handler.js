'use strict';

const { test_dest } = require('segment-sloth')
const { dest_payload } = require('./payload')

const settings = {
}

test_dest(dest_payload, settings, <sam_port>).then(() => {
}).catch(e =>{
  console.error(e)
})