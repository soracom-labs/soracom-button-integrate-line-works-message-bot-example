# LINE Works Bot for SORACOM LTE-M Button

This is an example program that implements a call button for business use using SORACOM LTE-M Button by integration with LINE Works.
Messages to LINE Works are sent from SORACOM Funk and AWS Lambda to any talk group through the LINE Works Bot API.

## Pre-required
1. [docker](https://www.docker.com/)
2. [AWS CLI](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-chap-welcome.html) (Optional)
3. [AWS CDK](https://aws.amazon.com/jp/cdk/)
4. [yarn](https://classic.yarnpkg.com/lang/en/)

## Useful commands

 * `yarn run cdk deploy`: deploy this stack to your default AWS account/region
 * `yarn run cdk diff`: compare deployed stack with current state
 * `ya:rn run cdk synth`: emits the synthesized CloudFormation template
 * `:sam-beta-cdk local invoke -e test/funk.json -n test/params.json --project-type CDK`: local invoke lambda function on docker container

 ## Enviroment Variables

* `API_ID`: LINE Works API ID
* `CONSUMER_KEY`: LINE Works API Consumer Key
* `BOT_NO`: LINE Works Bot No
* `SERVER_ID`: LINE Works Server ID
* `ROOM_ID`: Talk room ID of the message destination
* `EXTERNAL_ID`: External ID when IAM Role of SORACOM Funk Assume Role to permission to Invoke AWS Lambda
* `SORACOM_ACCOUNT_PRINCIPAL`: IAM Role principal of SORACOM Funk, default:762707677580(Japan coverage)
* `SERVER_TOKEN_SECRET_ARN`: AWS Systems Manager Parameter ARN of LINE Works Server authentication key

## Document
See also: [IoT Recipe URL](https://)