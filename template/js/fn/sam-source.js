const { call_src, generate_src_payload } = require('segment-sloth')
const { onRequest } = require('./function')
const { Headers, Blob, Body, FetchError, Request, Response } = require('node-fetch')
const btoa = require('btoa')
const atob = require('atob')

global.fetch = require('node-fetch')
global.Headers = Headers
global.Blob = Blob
global.Body = Body
global.FetchError = FetchError
global.Request = Request
global.Response = Response
global.btoa = btoa
global.atob = atob

exports.lambdaHandler = async (sam_event) => {
  let response;

  try {
    if (!sam_event.body) {
      const { payload, settings } = require('./tests/debug')
      sam_event = generate_src_payload(payload, settings)
    }
    const output = {}
    await call_src(sam_event, onRequest, output)
    response = {
      'statusCode': 200,
      'body': JSON.stringify(output),
    }
  } catch (err) {
    console.error(err);
    response = {
      'statusCode': 500,
      'body': JSON.stringify(err)
    }
  }

  return response
}
