import { Context, Callback } from 'aws-lambda';
import { SSM } from "@aws-sdk/client-ssm";
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import applyCaseMiddleware from 'axios-case-converter';
import urlJoin from 'url-join';

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

let AUTH_URL = 'https://auth.worksmobile.com/';
let API_URL = 'https://apis.worksmobile.com/';

async function getSSMParam(arn: string) {
    // arn:aws:ssm:{region}:{account_id}:parameter/{parameter_name}
    const ssmParamName = arn.split('/').slice(-1).pop();
    console.log(ssmParamName);
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

exports.handler = async function (event: Event, context: FunkContext, callback: Callback) {
    const apiID = process.env.API_ID || '';
    const consumerKey = process.env.CONSUMER_KEY || '';
    const botNo = process.env.BOT_NO || '';
    const serverID = process.env.SERVER_ID || '';
    const roomID = process.env.ROOM_ID || '';
    const serverTokenSecretARN = process.env.SERVER_TOKEN_SECRET_ARN || '';

    // Issue token
    const privateKey = await getSSMParam(serverTokenSecretARN);
    const issueTime = Math.floor(Date.now() / 1000);
    const authPayload: AuthRequest = {
        iss: serverID,
        iat: issueTime,
        exp: issueTime + (60 * 60), // 3600 sec
    }
    const token = jwt.sign(authPayload, Buffer.from(privateKey), { algorithm: 'RS256' });
    const authClient = applyCaseMiddleware(axios.create());
    const querystring = new URLSearchParams(
        {
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: token,
        }
    );
    const authURL = urlJoin(AUTH_URL, '/b/', apiID, '/server/token')
    const res = await authClient.post(
        authURL,
        querystring
    ).catch((error) => {
        console.error('Auth error: ' + JSON.stringify(error))
        return Promise.reject();
    });

    // Send message
    // `sam local invoke` will send 'IMSI does not found' to LINE Works because AWS SAM does not
    // support custom client context of AWS Lambda.
    // The SORACOM Funk invoke customer function with custom client context that contains information
    // that functions such as operator ID, ISMI, IMEI, etc. are useful for determining the calling button.
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
    const message: MessageToRoomID = {
        roomID: roomID,
        content: buttonTextMessageContent,
    }
    const messageURL = urlJoin(API_URL, '/r/', apiID, '/message/v1/bot/', botNo, '/message/push')
    await axios.post(
        messageURL,
        message,
        {
            headers: {
                'consumerKey': consumerKey,
                'Authorization': 'Bearer ' + res.data.accessToken,
            }
        }
    ).catch((error) => {
        console.error('Send message error: ' + JSON.stringify(error))
        return Promise.reject();
    })
};