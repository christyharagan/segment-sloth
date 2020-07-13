const {onRequest} = require('./out/function')
const {call_src} = require('segment-local-functions')
global.fetch = require('node-fetch')

let response;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.lambdaHandler = async (event, context) => {
    try {
        const output = {}
        await call_src(event, onRequest, output)
        response = {
            'statusCode': 200,
            'body': JSON.stringify(output)
        }
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};
