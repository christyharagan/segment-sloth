import { call_dest, generate_dest_payload } from 'segment-sloth'
import { onAlias, onGroup, onIdentify, onPage, onScreen, onTrack } from './function'
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
      sam_event = generate_dest_payload(payload, settings)
    }
    await call_dest(sam_event, { onAlias, onGroup, onIdentify, onPage, onScreen, onTrack })
    response = {
      'statusCode': 200,
      'body': '',
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
