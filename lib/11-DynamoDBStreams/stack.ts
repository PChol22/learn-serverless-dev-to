import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";

import path from "path";

import { restaurantBookedTemplateHtml } from './onRestaurantBooked/template';
import { reservationConfirmedTemplateHtml } from './onReservationConfirmed/template';
import { Stack } from "aws-cdk-lib";

export class Part11DynamoDBStreamsStack extends Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new cdk.aws_apigateway.RestApi(this, 'api', {
      restApiName: 'Part11Service',
    });

    // Use your own domain name
    const DOMAIN_NAME = 'pchol.fr';
    // I already created the SES identity in part 06
    const identity = cdk.aws_ses.EmailIdentity.fromEmailIdentityName(this, 'sesIdentity', DOMAIN_NAME);

    // Table to store reservations
    const table = new cdk.aws_dynamodb.Table(this, 'ReservationsTable', {
      partitionKey: { name: 'SK', type: cdk.aws_dynamodb.AttributeType.STRING },
      sortKey: { name: 'PK', type: cdk.aws_dynamodb.AttributeType.STRING },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: cdk.aws_dynamodb.StreamViewType.NEW_IMAGE,
    });

    // Event bus to dispatch events
    const bus = new cdk.aws_events.EventBus(this, 'EventBus');

    // Email template when a restaurant is booked
    const restaurantBookedTemplate = new cdk.aws_ses.CfnTemplate(this, 'RestaurantBookedTemplate', {
      template: {
        templateName: 'restaurantBookedTemplate',
        subjectPart: 'Restaurant booked',
        htmlPart: restaurantBookedTemplateHtml,
      }
    });

    // Email template when a reservation is confirmed
    const reservationConfirmedTemplate = new cdk.aws_ses.CfnTemplate(this, 'ReservationConfirmedTemplate', {
      template: {
        templateName: 'reservationConfirmedTemplate',
        subjectPart: 'Reservation confirmed',
        htmlPart: reservationConfirmedTemplateHtml,
      }
    });

    const bookRestaurant = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'BookRestaurant', {
      entry: path.join(__dirname, 'bookRestaurant', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        TABLE_NAME: table.tableName,
      }
    });
    
    table.grantWriteData(bookRestaurant);
    api.root.addResource('bookRestaurant').addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(bookRestaurant));

    const confirmReservation = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'ConfirmReservation', {
      entry: path.join(__dirname, 'confirmReservation', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        TABLE_NAME: table.tableName,
      }
    });

    table.grantWriteData(confirmReservation);
    api.root.addResource('confirmReservation').addResource('{reservationId}').addMethod('GET', new cdk.aws_apigateway.LambdaIntegration(confirmReservation));

    const streamTarget = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'StreamTarget', {
      entry: path.join(__dirname, 'streamTarget', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        TABLE_NAME: table.tableName,
        EVENT_BUS_NAME: bus.eventBusName,
      }
    });

    table.grantStreamRead(streamTarget);
    streamTarget.addEventSourceMapping('StreamSource', {
      eventSourceArn: table.tableStreamArn,
      startingPosition: cdk.aws_lambda.StartingPosition.LATEST,
      batchSize: 1,
    });
    streamTarget.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['events:PutEvents'],
      resources: [bus.eventBusArn],
    }));

    const onRestaurantBookedRule = new cdk.aws_events.Rule(this, 'OnRestaurantBookedRule', {
      eventBus: bus,
      eventPattern: {
        source: ['StreamTarget'],
        detailType: ['OnRestaurantBooked'],
      },
    });

    const onRestaurantBooked = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'OnRestaurantBookedLambda', {
      entry: path.join(__dirname, 'onRestaurantBooked', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        FROM_EMAIL_ADDRESS: `notifications@${identity.emailIdentityName}`,
        API_URL: api.url,
        TEMPLATE_NAME: restaurantBookedTemplate.ref,
      }
    });

    onRestaurantBookedRule.addTarget(new cdk.aws_events_targets.LambdaFunction(onRestaurantBooked));
    onRestaurantBooked.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['ses:SendTemplatedEmail'],
      resources: ['*'],
    }));

    const onReservationConfirmedRule = new cdk.aws_events.Rule(this, 'OnReservationConfirmedRule', {
      eventBus: bus,
      eventPattern: {
        source: ['StreamTarget'],
        detailType: ['OnReservationConfirmed'],
      },
    });

    const onReservationConfirmed = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'OnReservationConfirmedLambda', {
      entry: path.join(__dirname, 'onReservationConfirmed', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        FROM_EMAIL_ADDRESS: `notifications@${identity.emailIdentityName}`,
        TEMPLATE_NAME: reservationConfirmedTemplate.ref,
      }
    });

    onReservationConfirmedRule.addTarget(new cdk.aws_events_targets.LambdaFunction(onReservationConfirmed));
    onReservationConfirmed.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['ses:SendTemplatedEmail'],
      resources: ['*'],
    }));
  }
}
