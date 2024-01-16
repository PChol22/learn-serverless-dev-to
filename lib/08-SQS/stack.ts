import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import * as cdk from 'aws-cdk-lib';
import { join } from "path";

import { orderExecutedHtmlTemplate } from './orderExecutedHtmlTemplate';

export class Part08SQSStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const api = new cdk.aws_apigateway.RestApi(this, 'api', {
      restApiName: 'Part08Service',
    });

    // Use your own domain name
    const DOMAIN_NAME = 'pchol.fr';
    // I already created the SES identity in part 06
    const identity = cdk.aws_ses.EmailIdentity.fromEmailIdentityName(this, 'sesIdentity', DOMAIN_NAME);

    const ordersQueue = new cdk.aws_sqs.Queue(this, 'ordersQueue', {
      visibilityTimeout: cdk.Duration.seconds(120),
      fifo: true,
    });

    const eventSource = new cdk.aws_lambda_event_sources.SqsEventSource(ordersQueue, {
      batchSize: 1,
    });

    const ordersEventBus = new cdk.aws_events.EventBus(this, 'ordersEventBus');

    const notifyOrderExecutedRule = new cdk.aws_events.Rule(this, 'notifyOrderExecutedRule', {
      eventBus: ordersEventBus,
      eventPattern: {
        source: ['notifyOrderExecuted'],
        detailType: ['orderExecuted'],
      },
    });

    const orderExecutedTemplate = new cdk.aws_ses.CfnTemplate(this, 'orderExecutedTemplate', {
      template: {
        htmlPart: orderExecutedHtmlTemplate,
        subjectPart: 'Your order was passed to our provider!',
        templateName: 'orderExecutedTemplate',
      }
    });

    const requestOrder = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'requestOrder', {
      entry: join(__dirname, 'requestOrder', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        QUEUE_URL: ordersQueue.queueUrl,
      },
    });

    ordersQueue.grantSendMessages(requestOrder);
    api.root.addResource('request-order').addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(requestOrder));

    const executeOrder = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'executeOrder', {
      entry: join(__dirname, 'executeOrder', 'handler.ts'),
      handler: 'handler',
      environment: {
        EVENT_BUS_NAME: ordersEventBus.eventBusName,
      },
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      reservedConcurrentExecutions: 1,
      timeout: cdk.Duration.seconds(30),
    });

    executeOrder.addEventSource(eventSource);
    executeOrder.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['events:PutEvents'],
        resources: [ordersEventBus.eventBusArn],
      })
    );

    const notifyOrderExecuted = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'notifyOrderExecuted', {
      entry: join(__dirname, 'notifyOrderExecuted', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        SENDER_EMAIL: `contact@${identity.emailIdentityName}`,
        TEMPLATE_NAME: orderExecutedTemplate.ref,
      },
    });

    notifyOrderExecuted.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['ses:SendTemplatedEmail'],
        resources: ['*'],
      }),
    );

    notifyOrderExecutedRule.addTarget(new cdk.aws_events_targets.LambdaFunction(notifyOrderExecuted));
  }
}