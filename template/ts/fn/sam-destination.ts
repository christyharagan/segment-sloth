import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { call_dest, generate_dest_payload } from 'segment-sloth'
import { onAlias, onGroup, onIdentify, onPage, onScreen, onTrack } from './function'
import { Headers, Blob, Body, FetchError, Request, Response } from 'node-fetch'
import btoa from 'btoa'
import atob from 'atob'

declare const global: { Body: any, fetch: any, Headers: any, FetchError: any, Blob: any, Request: any, Response: any, btoa: any, atob: any }
global.fetch = require('node-fetch')
global.Headers = Headers as any
global.Blob = Blob as any
global.Body = Body as any
global.FetchError = FetchError as any
global.Request = Request as any
global.Response = Response as any
global.btoa = btoa
global.atob = atob

export const lambdaHandler = async (sam_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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
