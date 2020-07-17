const { onRequest } = require('./out/function')
const { call_src } = require('segment-local-functions')
global.fetch = require('node-fetch')
global.Headers = fetch.Headers
global.Blob = fetch.Blob
global.Body = fetch.Body
global.FetchError = fetch.FetchError
global.Request = fetch.Request
global.Response = fetch.Response

exports.lambdaHandler = async (event) => {
  let response;
  try {
    const output = {}
    await call_src(event, onRequest, output)
    response = {
      'statusCode': 200,
      'body': JSON.stringify(output)
    }
  } catch (err) {
    console.error(err);
    response = {
      'statusCode': 500,
      'body': JSON.stringify(err)
    }
  }

  return response
};
