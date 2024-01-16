import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { join } from 'path';

const DEVELOPERS_EMAILS = [
  'pchol.pro@gmail.com'
];

export class Part16LambdaDestinationsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cronTrigger = new cdk.aws_events.Rule(this, 'CronTrigger', {
      schedule: cdk.aws_events.Schedule.expression('rate(1 minute)'),
    });

    const onFailureTopic = new cdk.aws_sns.Topic(this, 'OnFailureTopic');

    const lambdaFunction = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'LambdaFunction', {
      entry: join(__dirname, 'lambda.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      onFailure: new cdk.aws_lambda_destinations.SnsDestination(onFailureTopic),
    });

    cronTrigger.addTarget(
      new cdk.aws_events_targets.LambdaFunction(lambdaFunction, {
        event: cdk.aws_events.RuleTargetInput.fromObject({ 
          veryImportantData: 'this should not be lost !!!',
        }),
        retryAttempts: 1, // 1 retry attempt
      }),
    );

    const failedEventsQueue = new cdk.aws_sqs.Queue(this, 'FailedEventsQueue');

    onFailureTopic.addSubscription(
      new cdk.aws_sns_subscriptions.SqsSubscription(failedEventsQueue)
    );

    DEVELOPERS_EMAILS.forEach((email) => {
      onFailureTopic.addSubscription(
        new cdk.aws_sns_subscriptions.EmailSubscription(email)
      );
    });
  }
}
