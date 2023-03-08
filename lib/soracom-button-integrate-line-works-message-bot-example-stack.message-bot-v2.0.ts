import { Context } from 'aws-lambda';
import { SSM } from "@aws-sdk/client-ssm";
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import applyCaseMiddleware from 'axios-case-converter';
import urlJoin from 'url-join';

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

interface lineWorksTokenIssuePayload {
    iss: string,
    sub: string,
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
    if (ssmParamName) {
        const ssm = new SSM({});
        const response = await ssm.getParameter({
            Name: ssmParamName,
            WithDecryption: true,
        });
        return (response.Parameter?.Value) ? (response.Parameter.Value) : ('');
    }
    return '';
}

exports.handler = async function (event: Event, context: FunkContext) {
    const botNo = process.env.BOT_NO_V2 || '';
    const appClientID = process.env.APP_CLIENT_ID || '';
    const appClientSecretARN = process.env.APP_CLIENT_SECRET_ARN || '';
    const serviceAccountID = process.env.SERVICE_ACCOUNT_ID || '';
    const channelID = process.env.CHANNEL_ID || '';
    const privateKeyARN = process.env.PRIVATE_KEY_ARN || '';

    const imsi = (context.clientContext?.imsi) ? (context.clientContext.imsi) : ('IMSI does not found');
    const clickTypeName = (event.clickTypeName) || ('ClickTypeName does not found');
    const buttonTextMessageContent: ButtonTextMessageContent = {
        type: 'button_template',
        contentText: 'SORACOM LTE-M Button clicked: ' + imsi + ' (' + clickTypeName + ')',
        actions: [
            {
                type: 'message',
                label: 'Ack',
                text: 'I\'ll handle it.',
            }
        ]
    }

    //Issue token

    const payload: lineWorksTokenIssuePayload = {
        iss: appClientID,
        sub: serviceAccountID,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // expires in 1 hour
    };
    const privateKey = await getSSMParam(privateKeyARN);
    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    const appClientSecret = await getSSMParam(appClientSecretARN);

    const authClient = applyCaseMiddleware(axios.create());
    const querystring = new URLSearchParams(
        {
            grant_type: API_GRANT_TYPE,
            assertion: token,
            client_secret: appClientSecret,
            client_id: appClientID,
            scope: API_SCOPE,
        }
    )
    const authURL = urlJoin(AUTH_URL, '/oauth2/v2.0/token')
    const authRes = await authClient.post(
        authURL,
        querystring
    ).catch((error) => {
        console.error('Auth error: ' + JSON.stringify(error))
        return Promise.reject();
    });

    // Send message
    const message = {
        content: buttonTextMessageContent,
    }
    const messageURL = urlJoin(API_URL, '/v1.0/bots/', botNo, '/channels/', channelID, '/messages');
    const messageClient = axios.create();
    await messageClient.post(
        messageURL,
        message,
        {
            headers: {
                'Authorization': 'Bearer ' + authRes.data.accessToken
            }
        }
    ).catch((error) => {
        console.error('Send message error: ' + JSON.stringify(error))
        return Promise.reject();
    });
};