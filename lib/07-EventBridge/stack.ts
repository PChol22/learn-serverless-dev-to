import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import * as cdk from 'aws-cdk-lib';
import { join } from "path";

import { bookingReceiptHtmlTemplate } from './bookingReceiptHtmlTemplate';


export class Part07EventBridgeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const api = new cdk.aws_apigateway.RestApi(this, 'api', {
      restApiName: 'Part07Service',
    });

     // Use your own domain name
     const DOMAIN_NAME = 'pchol.fr';
     // I already created the SES identity in part 06
     const identity = cdk.aws_ses.EmailIdentity.fromEmailIdentityName(this, 'sesIdentity', DOMAIN_NAME);

    const flightTable = new cdk.aws_dynamodb.Table(this, 'flightTable', {
      partitionKey: {
        name: 'PK',
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const eventBus = new cdk.aws_events.EventBus(this, 'eventBus');
    const rule = new cdk.aws_events.Rule(this, 'bookFlightRule', {
      eventBus,
      eventPattern: {
        source: ['bookFlight'],
        detailType: ['flightBooked'],
      },
    });

    const bookFlight = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'bookFlight', {
      entry: join(__dirname, 'bookFlight', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        TABLE_NAME: flightTable.tableName,
        EVENT_BUS_NAME: eventBus.eventBusName,
      },
    });

    bookFlight.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['events:PutEvents'],
        resources: [eventBus.eventBusArn],
      })
    );
    flightTable.grantReadData(bookFlight);
    api.root.addResource('book-flight').addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(bookFlight));

    const registerBooking = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'registerBooking', {
      entry: join(__dirname, 'registerBooking', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        TABLE_NAME: flightTable.tableName,
      },
    });
    flightTable.grantReadWriteData(registerBooking);
    rule.addTarget(new cdk.aws_events_targets.LambdaFunction(registerBooking));

    const bookingReceiptTemplate = new cdk.aws_ses.CfnTemplate(this, 'bookingReceiptTemplate', {
      template: {
        htmlPart: bookingReceiptHtmlTemplate,
        subjectPart: 'Your flight to {{destination}} was booked!',
        templateName: 'bookingReceiptTemplate',
      }
    });

    const sendBookingReceipt = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'sendBookingReceipt', {
      entry: join(__dirname, 'sendBookingReceipt', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        SENDER_EMAIL: `contact@${identity.emailIdentityName}`,
        TEMPLATE_NAME: bookingReceiptTemplate.ref,
      },
    });
    sendBookingReceipt.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['ses:SendTemplatedEmail'],
        resources: [`*`],
      })
    );
    rule.addTarget(new cdk.aws_events_targets.LambdaFunction(sendBookingReceipt));

    const syncFlights = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'syncFlights', {
      entry: join(__dirname, 'syncFlights', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        TABLE_NAME: flightTable.tableName,
      },
    });
    flightTable.grantWriteData(syncFlights);

    const syncFlightsRule = new cdk.aws_events.Rule(this, 'syncFlightsRule', {
      schedule: cdk.aws_events.Schedule.rate(cdk.Duration.days(1)),
    });
    syncFlightsRule.addTarget(new cdk.aws_events_targets.LambdaFunction(syncFlights));
  }
}