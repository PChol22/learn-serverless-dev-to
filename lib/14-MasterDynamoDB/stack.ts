import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { join } from 'path';

// Use the Node18 runtime which provides the aws-sdk v3 natively
// This way our Lambda functions bundles will be smaller
const sharedLambdaConfig = {
  runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
  bundling: {
    externalModules: ['@aws-sdk'],
  },
};

export class Part14MasterDynamoDBStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new cdk.aws_apigateway.RestApi(this, 'Part14Service');

    const table = new cdk.aws_dynamodb.Table(this, 'DdbTable', {
      partitionKey: { name: 'PK', type: cdk.aws_dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: cdk.aws_dynamodb.AttributeType.STRING },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const classicRoute = api.root.addResource('classic');

    const classicCreateUser = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'ClassicCreateUser', {
      entry: join(__dirname, 'classic.ts'),
      handler: 'createUser',
      environment: {
        TABLE_NAME: table.tableName,
      },
      ...sharedLambdaConfig,
    });
    table.grantWriteData(classicCreateUser);
    classicRoute.addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(classicCreateUser));

    const classicListUsers = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'ClassicListUsers', {
      entry: join(__dirname, 'classic.ts'),
      handler: 'listUsers',
      environment: {
        TABLE_NAME: table.tableName,
      },
      ...sharedLambdaConfig,
    });
    table.grantReadData(classicListUsers);
    classicRoute.addMethod('GET', new cdk.aws_apigateway.LambdaIntegration(classicListUsers));

    const documentRoute = api.root.addResource('document');

    const documentCreateUser = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'DocumentCreateUser', {
      entry: join(__dirname, 'document.ts'),
      handler: 'createUser',
      environment: {
        TABLE_NAME: table.tableName,
      },
      ...sharedLambdaConfig,
    });
    table.grantWriteData(documentCreateUser);
    documentRoute.addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(documentCreateUser));

    const documentListUsers = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'DocumentListUsers', {
      entry: join(__dirname, 'document.ts'),
      handler: 'listUsers',
      environment: {
        TABLE_NAME: table.tableName,
      },
      ...sharedLambdaConfig,
    });
    table.grantReadData(documentListUsers);
    documentRoute.addMethod('GET', new cdk.aws_apigateway.LambdaIntegration(documentListUsers));

    const toolboxRoute = api.root.addResource('toolbox');

    const toolboxCreateUser = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'ToolboxCreateUser', {
      entry: join(__dirname, 'toolbox.ts'),
      handler: 'createUser',
      environment: {
        TABLE_NAME: table.tableName,
      },
      ...sharedLambdaConfig,
    });
    table.grantWriteData(toolboxCreateUser);
    toolboxRoute.addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(toolboxCreateUser));

    const toolboxListUsers = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'ToolboxListUsers', {
      entry: join(__dirname, 'toolbox.ts'),
      handler: 'listUsers',
      environment: {
        TABLE_NAME: table.tableName,
      },
      ...sharedLambdaConfig,
    });
    table.grantReadData(toolboxListUsers);
    toolboxRoute.addMethod('GET', new cdk.aws_apigateway.LambdaIntegration(toolboxListUsers));
  }
}
