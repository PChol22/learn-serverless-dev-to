import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";

import path from "path";
import { Stack } from "aws-cdk-lib";

export class Part10SNSStack extends Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new cdk.aws_apigateway.RestApi(this, 'api', {
      restApiName: 'Part10Service',
    });

    const topic = new cdk.aws_sns.Topic(this, 'ArticleTopic');

    const orderItem = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'OrderItem', {
      entry: path.join(__dirname, 'orderItem', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        TOPIC_ARN: topic.topicArn,
      }
    });
    topic.grantPublish(orderItem);
    api.root.addResource('orderItem').addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(orderItem));

    const executeOrder = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'ExecuteOrder', {
      entry: path.join(__dirname, 'executeOrder', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
    });
    topic.addSubscription(new cdk.aws_sns_subscriptions.LambdaSubscription(executeOrder));

    const requestDelivery = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'RequestDelivery', {
      entry: path.join(__dirname, 'requestDelivery', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
    });
    topic.addSubscription(new cdk.aws_sns_subscriptions.LambdaSubscription(requestDelivery, { filterPolicy: {
      requestDelivery: cdk.aws_sns.SubscriptionFilter.stringFilter({ allowlist: ["true"] })
    }}));

    const sendNotification = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'SendNotification', {
      entry: path.join(__dirname, 'sendNotification', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
    });
    topic.addSubscription(new cdk.aws_sns_subscriptions.LambdaSubscription(sendNotification, { filterPolicy: {
      sendNotification: cdk.aws_sns.SubscriptionFilter.stringFilter({ allowlist: ["true"] })
    }}));
  }
}