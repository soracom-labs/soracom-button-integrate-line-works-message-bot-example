import { Context, Callback } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import * as jwt from 'jsonwebtoken';
import * as querystring from 'querystring';
import axios from 'axios';
import applyCaseMiddleware from 'axios-case-converter';

interface MessageToRoomID {
    roomID: string,
    content: TextMessageContent | ButtonTextMessageContent,
}
interface TextMessageContent {
    type: string,
    text: string,
}
interface ButtonTextMessageContent {
    type: string,
    contentText: string,
    actions: ActionObject[],
}

interface ActionObject {
    type: string,
    label: string,
    text: string,
    postback?: string,
}
interface Event {
    clickType: string,
    clickTypeName: string,
    batteryLevel: string,
    binaryParserEnabled: boolean,
}

interface FunkContext extends Omit<Context, 'clientContext'> {
    clientContext: FunkClientContext
}

interface FunkClientContext {
    operatorId: string,
    coverage: string,
    resourceType: string,
    resourceId: string,
    sourceProtocol: string,
    srn: string,
    imsi: string,
    imei: string,
    custom?: FunkClientContext,
}

interface AuthRequest {
    iss: string,
    iat: number,
    exp: number,
}

const AUTH_URL = 'https://auth.worksmobile.com/';
const API_URL = 'https://www.worksapis.com/';
const API_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:jwt-bearer';
const API_SCOPE = 'bot';

async function getSSMParam(arn: string) {
    // arn:aws:ssm:{region}:{account_id}:parameter/{parameter_name}
    const ssmParamName = arn.split('/').slice(-1).pop();
    console.log(ssmParamName);
    if (ssmParamName) {
        const ssm = new AWS.SSM();
        const response = await ssm.getParameter({
            Name: ssmParamName,
            WithDecryption: true,
        }).promise();
        return (response.Parameter?.Value) ? (response.Parameter.Value) : ('');
    }
    return '';
}

exports.handler = async function (event: Event, context: FunkContext) {
    const botNo = process.env.BOT_NO || '';
    const appClientID = process.env.APP_CLIENT_ID || '';
    const appClientSecretARN = process.env.APP_CLIENT_SECRET_ARN || '';
    const serviceAccountID = process.env.SERVICE_ACCOUNT_ID || '';
    const channelID = process.env.CHANNEL_ID || '';
    const privateKeyARN = process.env.PRIVATE_KEY_ARN || '';

    const imsi = (context.clientContext?.imsi) ? (context.clientContext.imsi) : ('IMSI does not found');
    const buttonTextMessageContent: ButtonTextMessageContent = {
        type: 'button_template',
        contentText: 'SORACOM LTE-M Button clicked: ' + imsi + ' (' + event.clickTypeName + ')',
        actions: [
            {
                type: 'message',
                label: 'Ack',
                text: 'I\'ll handle it.',
            }
        ]
    }

    //Issue token
    const payload = {
        iss: appClientID,
        sub: serviceAccountID,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // expires in 1 hour
    };
    const privateKey = await getSSMParam(privateKeyARN);
    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    const appClientSecret = await getSSMParam(appClientSecretARN);

    const authClient = applyCaseMiddleware(axios.create());
    const res = await authClient.post(
        AUTH_URL + '/oauth2/v2.0/token',
        querystring.stringify({
            grant_type: API_GRANT_TYPE,
            assertion: token,
            client_secret: appClientSecret,
            client_id: appClientID,
            scope: API_SCOPE,
        })).catch((error) => {
            console.error('Auth error: ' + JSON.stringify(error))
            return Promise.reject();
        });

    // Send message
    const message = {
        content: buttonTextMessageContent,
    }
    await axios.post(
        API_URL + '/v1.0/bots/' + botNo + '/channels/' + channelID + '/messages',
        message,
        {
            headers: {
                'Authorization': 'Bearer ' + res.data.access_token,
            }
        }
    ).catch((error) => {
        console.error('Send message error: ' + JSON.stringify(error))
        return Promise.reject();
    });

};