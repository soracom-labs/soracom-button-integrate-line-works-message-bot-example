[![test](https://github.com/soracom-labs/soracom-button-integrate-line-works-message-bot-example/workflows/test/badge.svg)](https://github.com/soracom-labs/soracom-button-integrate-line-works-message-bot-example/actions/workflows/test.yml)

# LINE Works Bot for SORACOM LTE-M Button

This is an example program that implements a call button for business use using SORACOM LTE-M Button by integration with LINE Works.
Messages to LINE Works are sent from SORACOM Funk and AWS Lambda to any talk group through the LINE Works Bot API.

## Important
LINE Works API will be discontinued on April 30, 2023. This CDK repository creates AWS Lambda functions that correspond to API versions 1.0 and 2.0, but unless there is a special reason, please use Lambda functions that support version 2.0 when using them for new projects. If you are currently using version 1.0, please migrate to version 2.0 by the EOL.

- The difference between API 2.0 and API 1.0: https://developers.worksmobile.com/jp/reference/difference-between-api
- Upgrade guide for API 2.0 bot: https://developers.worksmobile.com/jp/reference/bot-upgrade-guide

## Pre-required
1. [docker](https://www.docker.com/) or docker altanative
2. [AWS CLI](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-chap-welcome.html)
3. [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/cli.html)
4. [yarn](https://classic.yarnpkg.com/lang/en/)

## Enviroment Variables
### for API version 1.0
- `API_ID`: LINE Works API ID
- `CONSUMER_KEY`: LINE Works API v1.0 Consumer Key
- `BOT_NO`: LINE Works API v1.0 Bot No
- `SERVER_ID`: LINE Works API v1.0 Server ID
- `ROOM_ID`: Talk room ID of the message destination
- `SERVER_TOKEN_SECRET_ARN`: AWS Systems Manager Parameter ARN of LINE Works Server authentication key
- `EXTERNAL_ID`: External ID when IAM Role of SORACOM Funk Assume Role to permission to Invoke AWS Lambda
- `SORACOM_ACCOUNT_PRINCIPAL`: IAM Role principal of SORACOM Funk, default:762707677580(Japan coverage)

### for API version 2.0
- `BOT_NO_V2`: LINE Works API v2.0 bot No
- `APP_CLIENT_ID` LINE Works API v2.0 app client id
- `APP_CLIENT_SECRET_ARN` LINE Works v2.0 app client secret
- `SERVICE_ACCOUNT_ID` LINE Works v2.0 app service account id
- `CHANNEL_ID` LINE Works v2.0 talk channel id
- `PRIVATE_KEY_ARN` LINE Works v2.0 app private key ARN (Amazon Resource Names)
- `EXTERNAL_ID`: External ID when IAM Role of SORACOM Funk Assume Role to permission to Invoke AWS Lambda
- `SORACOM_ACCOUNT_PRINCIPAL`: IAM Role principal of SORACOM Funk, default:762707677580(Japan coverage)

## Getting started
In LINE Works API version 2.0, please register your app in the Developer Console to obtain the `Client ID`, `Client Secret`, `Service Account`, and `Private Key`, and specify `bot` in the OAuth Scopes. Then add the bot to obtain the `BOT ID`.

Version 1.0 cannot be used for new projects.

### for existing users of API version 1.0
```shell
$ aws ssm put-parameter --name "line-works-server-token-secret" --type "SecureString" --value "$(cat api-v1.0-server-token.key)" 
$ SERVER_TOKEN_SECRET_ARN=$(aws ssm get-parameter --name "line-works-server-token-secret" --query 'Parameter.ARN' --output text)
```

### for API version 2.0 users
```shell
$ aws ssm put-parameter --name "line-works-app-client-secret-v2" --type "SecureString" --value "api-v2.0-app-client-secret"
$ aws ssm put-parameter --name "line-works-app-private-key-v2" --type "SecureString" --value "$(cat api-v2.0-app-private.key)"
$ APP_CLIENT_SECRET_ARN=$(aws ssm get-parameter --name "line-works-app-client-secret-v2" --query 'Parameter.ARN' --output text)
$ PRIVATE_KEY_ARN=$(aws ssm get-parameter --name "line-works-app-private-key-v2" --query 'Parameter.ARN' --output text)
```

```shell
$ npm install -g aws-cdk # only first time
$ cdk bootstrap # only first time
$ yarn install
$ API_ID='xxxxxx' CONSUMER_KEY='xxxxxx' BOT_NO='xxxxxx' BOT_NO_V2='xxxxxx' \
SERVER_ID='xxxxxx' ROOM_ID='xxxxxx' EXTERNAL_ID='xxxxxx' \
SERVER_TOKEN_SECRET_ARN=$SERVER_TOKEN_SECRET_ARN APP_CLIENT_ID='xxxxxx' \
APP_CLIENT_SECRET_ARN=$APP_CLIENT_SECRET_ARN SERVICE_ACCOUNT_ID='xxxxxx' \
CHANNEL_ID='xxxxxx' PRIVATE_KEY_ARN=$PRIVATE_KEY_ARN \
yarn run cdk deploy --no-staging
```

## AWS Lambda local test
```
$ cp test/params-v2.0.json.org test/params-v2.0.json
$ vim test/params-v2.0.json
$ yarn run cdk synth
$ sam local invoke -e test/funk.json -n test/params-v2.0.json -t ./cdk.out/SoracomButtonIntegrateLineWorksMessageBotExampleStack.template.json message-bot-v2.0
```

## The migration from LINE Works API version 1.0 to v2.0 proceeds with the following steps:

- Create an API v2.0 compatible app and bot in LINE Works Developer Console.
- Create an API v2.0 compatible bot in LINE Works Developer Console.
- Create a v2.0 compatible Lambda using the scripts and CDK in this repository.
- Prepare a test SORACOM LTE-M Button, configure it to work with the v2.0 compatible Lambda using SORACOM Funk, and verify its operation.

## Document
See also: [IoT Recipe URL](https://soracom.jp/recipes_index/14133/)
