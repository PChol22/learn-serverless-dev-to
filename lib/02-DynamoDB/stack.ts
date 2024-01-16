import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import * as cdk from 'aws-cdk-lib';
import { join } from "path";

export class Part02DynamoDBStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Provision a new REST API Gateway
    const api = new cdk.aws_apigateway.RestApi(this, 'myFirstApi', {
      restApiName: 'Part02Service',
    });

    const database = new cdk.aws_dynamodb.Table(this, 'myFirstDatabase', {
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

    const createNote = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'createNote', {
      entry: join(__dirname, 'createNote', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        TABLE_NAME: database.tableName,
      },
    });

    database.grantWriteData(createNote);

    const getNote = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'getNote', {
      entry: join(__dirname, 'getNote', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        TABLE_NAME: database.tableName,
      },
    });

    database.grantReadData(getNote);

    const usersResource = api.root.addResource('users').addResource('{userId}');
    const notesResource = usersResource.addResource('notes');
    notesResource.addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(createNote));
    notesResource.addResource('{id}').addMethod('GET', new cdk.aws_apigateway.LambdaIntegration(getNote));
  }
}