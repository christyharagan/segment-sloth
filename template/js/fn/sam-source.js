import { call_src, generate_src_payload } from 'segment-sloth'
import { onRequest } from './function'
import { Headers, Blob, Body, FetchError, Request, Response } from 'node-fetch'

global.fetch = require('node-fetch')
global.Headers = Headers
global.Blob = Blob
global.Body = Body
global.FetchError = FetchError
global.Request = Request
global.Response = Response

export const lambdaHandler = async (sam_event) => {
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
