const { call_dest, generate_dest_payload } = require('segment-sloth')
const { onAlias, onGroup, onIdentify, onPage, onScreen, onTrack } = require('./function')
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
