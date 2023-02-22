import { Construct } from "constructs"
import { Stack, StackProps } from "aws-cdk-lib"
import { CfnOutput } from "aws-cdk-lib"
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
export class SoracomButtonIntegrateLineWorksMessageBotExampleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // for API ver v1.0
    const BOT_NO: string = process.env.BOT_NO || '';
    const API_ID: string = process.env.API_ID || '';
    const CONSUMER_KEY: string = process.env.CONSUMER_KEY || '';
    const SERVER_ID: string = process.env.SERVER_ID || '';
    const ROOM_ID: string = process.env.ROOM_ID || '';
    const SERVER_TOKEN_SECRET_ARN: string = process.env.SERVER_TOKEN_SECRET_ARN || '';
    const SORACOM_ACCOUNT_PRINCIPAL: string = process.env.SORACOM_ACCOUNT_PRINCIPLE || '762707677580'; // JP coverage
    const EXTERNAL_ID: string = process.env.EXTERNAL_ID || '';

    // for API ver v2.0
    const BOT_NO_V2: string = process.env.BOT_NO_V2 || '';
    const APP_CLIENT_ID: string = process.env.APP_CLIENT_ID || '';
    const APP_CLIENT_SECRET_ARN: string = process.env.APP_CLIENT_SECRET_ARN || '';
    const SERVICE_ACCOUNT_ID: string = process.env.SERVICE_ACCOUNT_ID || '';
    const CHANNEL_ID: string = process.env.CHANNEL_ID || '';
    const PRIVATE_KEY_ARN: string = process.env.PRIVATE_KEY_ARN || '';

    const lambdaRoleV2 = new iam.Role(this, 'message-bot-lambda-role-v2', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),

    });

    if (BOT_NO != '' && API_ID != '' && CONSUMER_KEY != '' && SERVER_ID != '' && ROOM_ID != '' && SERVER_TOKEN_SECRET_ARN != '' && EXTERNAL_ID != '') {
      const lambdaRole = new iam.Role(this, 'message-bot-lambda-role', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),

      });

      lambdaRole.addToPolicy(new iam.PolicyStatement({
        resources: [
          SERVER_TOKEN_SECRET_ARN,
        ],
        actions: ['ssm:GetParameter'],
      }));


      lambdaRole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
      );

      const lambdaFunction = new lambda.NodejsFunction(this, 'message-bot', {
        role: lambdaRole,
        environment: {
          'API_ID': API_ID,
          'CONSUMER_KEY': CONSUMER_KEY,
          'BOT_NO': BOT_NO,
          'SERVER_ID': SERVER_ID,
          'ROOM_ID': ROOM_ID,
          'SERVER_TOKEN_SECRET_ARN': SERVER_TOKEN_SECRET_ARN,
        }
      });
      new CfnOutput(this, `lambda-function-arn`, { value: lambdaFunction.functionArn });
    }

    lambdaRoleV2.addToPolicy(new iam.PolicyStatement({
      resources: [
        APP_CLIENT_SECRET_ARN,
        PRIVATE_KEY_ARN,
      ],
      actions: ['ssm:GetParameter'],
    }));


    lambdaRoleV2.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole',
      ),
    );

    const lambdaFunctionV2 = new lambda.NodejsFunction(this, 'message-bot-v2.0', {
      role: lambdaRoleV2,
      environment: {
        'BOT_NO_V2': BOT_NO_V2,
        'APP_CLIENT_ID': APP_CLIENT_ID,
        'APP_CLIENT_SECRET_ARN': APP_CLIENT_SECRET_ARN,
        'SERVICE_ACCOUNT_ID': SERVICE_ACCOUNT_ID,
        'CHANNEL_ID': CHANNEL_ID,
        'PRIVATE_KEY_ARN': PRIVATE_KEY_ARN,
      }
    });
    new CfnOutput(this, `lambda-function-v2-arn`, { value: lambdaFunctionV2.functionArn });

    const funkRole = new iam.Role(this, 'message-bot-soracom-funk-role', {
      roleName: 'message-bot-soracom-funk-role',
      assumedBy: new iam.AccountPrincipal(SORACOM_ACCOUNT_PRINCIPAL),
      externalIds: [EXTERNAL_ID],
    });
    new CfnOutput(this, `soracom-funk-role`, { value: funkRole.roleArn });

    funkRole.addToPolicy(new iam.PolicyStatement({
      resources: ['*'],
      actions: ['lambda:InvokeFunction'],
    }));
  };
};
