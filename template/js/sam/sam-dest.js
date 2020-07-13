const fns = require('./src/function')
const {call_dest} = require('segment-local-functions')
global.fetch = require('node-fetch')

let response;

exports.lambdaHandler = async (event, context) => {
    try {
        const output = {}
        await call_dest(event, fns, output)
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
