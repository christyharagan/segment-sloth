'use strict';

const { test_src } = require('segment-sloth')
const { src_payload } = require('./payload')

const settings = {
}

test_src(src_payload, settings, <sam_port>).then(result => {
  console.log(result)
}).catch(e =>{
  console.error(e)
})