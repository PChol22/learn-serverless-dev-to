# Code example for my series "Learn serverless on AWS step-by-step"

## TL;DR

This repository contains the code examples for my series "Learn serverless on AWS step-by-step".
It is written using Typescript and the AWS CDK. To each article corresponds a new CDK stack.

## How to use

```bash
npm i
npm run cdk bootstrap
npm run deploy # deploy all stacks
# or
npm run cdk deploy <stack-name> # deploy a specific stack
```

## AWS Billing

🚨 Some resources deployed in this repository are not covered by the AWS Free Tier (but still cheap):

- 1 Secret in AWS Secrets Manager **(~0.50$/month)**
- 1 Hosted Zone in Route53 **(~0.50$/month)**
- 1 Aurora Serverless DB cluster **(~0$/month with autoPause)**

_For comparison, on my personal account, I pay **~1$/month** to keep all the resources deployed in this repository._

## Missing articles

🚨 Some articles (basically those that need a frontend) are in a dedicated repository. I linked the corresponding repository in each affected folder.

## Articles

### Part 1 - Lambda functions

- 🗞 [Article](https://dev.to/slsbytheodo/dont-miss-on-the-cloud-revolution-learn-serverless-on-aws-the-right-way-1kac)
- 💻 [Code](./lib/01-Lambda/stack.ts)

### Part 2 - DynamoDB

- 🗞 [Article](https://dev.to/slsbytheodo/learn-serverless-on-aws-step-by-step-databases-kkg)
- 💻 [Code](./lib/02-DynamoDB/stack.ts)

### Part 3 - S3

- 🗞 [Article](https://dev.to/slsbytheodo/learn-serverless-on-aws-step-by-step-file-storage-10f7)
- 💻 [Code](./lib/03-S3/stack.ts)

### Part 4 - Cognito

- 🗞 [Article](https://dev.to/slsbytheodo/learn-serverless-on-aws-authentication-with-cognito-19bo)
- 💻 [Code](./lib/04-Cognito/stack.ts)

### Part 5 - Step Functions

- 🗞 [Article](https://dev.to/slsbytheodo/learn-serverless-on-aws-step-by-step-step-functions-4m7c)
- 💻 [Code](./lib/05-StepFunctions/stack.ts)

### Part 6 - SES

- 🗞 [Article](https://dev.to/slsbytheodo/learn-serverless-on-aws-step-by-step-emails-49hp)
- 💻 [Code](./lib/06-SES/stack.ts)

### Part 7 - EventBridge

- 🗞 [Article](https://dev.to/slsbytheodo/learn-serverless-on-aws-step-by-step-eventbridge-27aa)
- 💻 [Code](./lib/07-EventBridge/stack.ts)

### Part 8 - SQS

- 🗞 [Article](https://dev.to/slsbytheodo/learn-serverless-on-aws-step-by-step-sqs-26c8)
- 💻 [Code](./lib/08-SQS/stack.ts)

### Part 9 - Aurora Serverless

- 🗞 [Article](https://dev.to/slsbytheodo/learn-serverless-on-aws-step-by-step-sql-with-aurora-5hn1)
- 💻 [Code](./lib/09-Aurora/stack.ts)

### Part 10 - SNS

- 🗞 [Article](https://dev.to/slsbytheodo/learn-serverless-on-aws-step-by-step-sns-2b46)
- 💻 [Code](./lib/10-SNS/stack.ts)

### Part 11 - DynamoDB Streams

- 🗞 [Article](https://dev.to/slsbytheodo/learn-serverless-on-aws-step-by-step-dynamodb-streams-21g5)
- 💻 [Code](./lib/11-DynamoDBStreams/stack.ts)

### Part 12 - Deploying a frontend

- 🗞 [Article](https://dev.to/slsbytheodo/learn-serverless-on-aws-step-by-step-deploy-a-frontend-31a6)
- 💻 [Code](./lib/12-Frontend/README.md)

### Part 13 - Strongly typed Lambda functions

- 🗞 [Article](https://dev.to/slsbytheodo/learn-serverless-on-aws-step-by-step-strong-types-213i)
- 💻 [Code](./lib/13-LambdaTypes/README.md)

### Part 14 - Master DynamoDB

- 🗞 [Article](https://dev.to/slsbytheodo/learn-serverless-on-aws-step-by-step-master-dynamodb-3cki)
- 💻 [Code](./lib/14-MasterDynamoDB/stack.ts)

### Part 15 - Upload files on S3

- 🗞 [Article](https://dev.to/slsbytheodo/learn-serverless-on-aws-step-by-step-upload-files-on-s3-50d4)
- 💻 [Code](./lib/15-UploadS3/README.md)

### Part 16 - Lambda Destinations

- 🗞 [Article](https://dev.to/slsbytheodo/learn-serverless-on-aws-step-by-step-lambda-destinations-f5b)
- 💻 [Code](./lib/16-LambdaDestinations/stack.ts)

### Part 17 - EventBridge Scheduler

- 🗞 Article - Coming soon
- 💻 [Code](./lib/17-EventBridgeScheduler/stack.ts)
