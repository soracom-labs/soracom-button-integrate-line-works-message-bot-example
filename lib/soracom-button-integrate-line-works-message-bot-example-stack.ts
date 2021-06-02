import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';
import * as iam from '@aws-cdk/aws-iam';
export class SoracomButtonIntegrateLineWorksMessageBotExampleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const API_ID: string = process.env.API_ID || '';
    const CONSUMER_KEY: string = process.env.CONSUMER_KEY || '';
    const BOT_NO: string = process.env.BOT_NO || '';
    const SERVER_ID: string = process.env.SERVER_ID || '';
    const ROOM_ID: string = process.env.ROOM_ID || '';
    const SERVER_TOKEN_SECRET_ARN: string = process.env.SERVER_TOKEN_SECRET_ARN || '';
    const SORACOM_ACCOUNT_PRINCIPAL: string = process.env.SORACOM_ACCOUNT_PRINCIPLE || '762707677580'; // JP coverage
    const EXTERNAL_ID: string = process.env.EXTERNAL_ID || '';

    const lambdaRole = new iam.Role(this, 'message-bot-lambda-role', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),

    });

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      resources: [SERVER_TOKEN_SECRET_ARN],
      actions: ['ssm:GetParameter'],
    }));

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole',
      ),
    );

    new lambda.NodejsFunction(this, 'message-bot', {
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

    const funkRole = new iam.Role(this, 'message-bot-soracom-funk-role', {
      roleName: 'message-bot-soracom-funk-role',
      assumedBy: new iam.AccountPrincipal(SORACOM_ACCOUNT_PRINCIPAL),
      externalIds: [EXTERNAL_ID],
    });
    new cdk.CfnOutput(this, `soracom-funk-role`, { value: funkRole.roleArn });

    funkRole.addToPolicy(new iam.PolicyStatement({
      resources: ['*'],
      actions: ['lambda:InvokeFunction'],
    }));
  };
};
