import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { Part01LambdaStack } from '../lib/01-Lambda/stack';
import { Part02DynamoDBStack } from '../lib/02-DynamoDB/stack';
import { Part03S3Stack } from '../lib/03-S3/stack';
import { Part04CognitoStack } from '../lib/04-Cognito/stack';
import { Part05StepFunctionsStack } from '../lib/05-StepFunctions/stack';
import { Part06SESStack } from '../lib/06-SES/stack';
import { Part07EventBridgeStack } from '../lib/07-EventBridge/stack';
import { Part08SQSStack } from '../lib/08-SQS/stack';
import { Part09AuroraStack } from '../lib/09-Aurora/stack';
import { Part10SNSStack } from '../lib/10-SNS/stack';
import { Part11DynamoDBStreamsStack } from '../lib/11-DynamoDBStreams/stack';
// Part 12 not in this repo, more details below
// Part 13 not in this repo, more details below
import { Part14MasterDynamoDBStack } from '../lib/14-MasterDynamoDB/stack';
// Part 15 not in this repo, more details below
import { Part16LambdaDestinationsStack } from '../lib/16-LambdaDestinations/stack';
import { Part17EventBridgeSchedulerStack } from '../lib/17-EventBridgeScheduler/stack';

const app = new cdk.App();

new Part01LambdaStack(app, 'Part01LambdaStack');

new Part02DynamoDBStack(app, 'Part02DynamoDBStack');

new Part03S3Stack(app, 'Part03S3Stack');

new Part04CognitoStack(app, 'Part04CognitoStack');

new Part05StepFunctionsStack(app, 'Part05StepFunctionsStack');

new Part06SESStack(app, 'Part06SESStack')

new Part07EventBridgeStack(app, 'Part07EventBridgeStack');

new Part08SQSStack(app, 'Part08SQSStack');

new Part09AuroraStack(app, 'Part09AuroraStack');

new Part10SNSStack(app, 'Part10SNSStack');

new Part11DynamoDBStreamsStack(app, 'Part11DynamoDBStreamsStack');

// The code for article 12: "Deploy a frontend" is not in this repo! (it needs a frontend)
// Find it here: https://github.com/PChol22/learn-serverless-backendxfrontend/tree/episode-12
// (Specific branch, continues in article 13)

// The code for article 13: "Strongly type Lambda functions" is not in this repo! (it needs a frontend)
// Find it here: https://github.com/PChol22/learn-serverless-backendxfrontend
// (Last commit on main, direct follow-up of article 12)

new Part14MasterDynamoDBStack(app, 'Part14MasterDynamoDBStack');

// The code for article 15: "Upload files on S3" is not in this repo! (it needs a frontend)
// Find it here: https://github.com/PChol22/learn-serverless-upload-s3
// (Last commit on main)

new Part16LambdaDestinationsStack(app, 'Part16LambdaDestinationsStack');

new Part17EventBridgeSchedulerStack(app, 'Part17SchedulerStack');
