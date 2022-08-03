import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { call_src, generate_src_payload } from 'segment-sloth'
import { onRequest } from './function'
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
