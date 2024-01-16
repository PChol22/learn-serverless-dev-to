import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import * as cdk from 'aws-cdk-lib';
import { join } from "path";

export class Part05StepFunctionsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const api = new cdk.aws_apigateway.RestApi(this, 'api', {
      restApiName: 'Part05Service',
    });

    const storeDB = new cdk.aws_dynamodb.Table(this, 'storeDB', {
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

    const isItemInStock = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'isItemInStock', {
      entry: join(__dirname, 'isItemInStock', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        TABLE_NAME: storeDB.tableName,
      },
    });
    storeDB.grantReadData(isItemInStock);

    const updateItemStock = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'updateItemStock', {
      entry: join(__dirname, 'updateItemStock', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        TABLE_NAME: storeDB.tableName,
      },
    });
    storeDB.grantWriteData(updateItemStock);

    const createOrder = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'createOrder', {
      entry: join(__dirname, 'createOrder', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        TABLE_NAME: storeDB.tableName,
      },
    });

    storeDB.grantWriteData(createOrder);

    const isItemInStockMappedTask = new cdk.aws_stepfunctions.Map(this, 'isItemInStockMappedTask', {
      itemsPath: '$.order',
      resultPath: cdk.aws_stepfunctions.JsonPath.DISCARD,
      parameters: {
        'item.$': '$$.Map.Item.Value',
      },
    }).iterator(new cdk.aws_stepfunctions_tasks.LambdaInvoke(this, 'isItemInStockTask', {
      lambdaFunction: isItemInStock,
    }));

    const updateItemStockMappedTask = new cdk.aws_stepfunctions.Map(this, 'updateItemStockMappedTask', {
      itemsPath: '$.order',
      parameters: {
        'item.$': '$$.Map.Item.Value',
      },
    }).iterator(new cdk.aws_stepfunctions_tasks.LambdaInvoke(this, 'updateItemStockTask', {
      lambdaFunction: updateItemStock,
    }));

    const createOrderTask = new cdk.aws_stepfunctions_tasks.LambdaInvoke(this, 'createOrderTask', {
      lambdaFunction: createOrder,
    });

    const parallelState = new cdk.aws_stepfunctions.Parallel(this, 'parallelState', {});

    parallelState.branch(updateItemStockMappedTask, createOrderTask);

    const definition = isItemInStockMappedTask.next(
      parallelState
    );

    const myFirstStateMachine = new cdk.aws_stepfunctions.StateMachine(this, 'myFirstStateMachine', {
      definition,
    });

    const invokeStateMachineRole = new cdk.aws_iam.Role(this, 'invokeStateMachineRole', {
      assumedBy: new cdk.aws_iam.ServicePrincipal('apigateway.amazonaws.com'),
    });

    invokeStateMachineRole.addToPolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['states:StartExecution'],
        resources: [myFirstStateMachine.stateMachineArn],
      })
    );

    const createOrderResource = api.root.addResource('create-order');
    
    createOrderResource.addMethod('POST', new cdk.aws_apigateway.Integration({
      type: cdk.aws_apigateway.IntegrationType.AWS,
      integrationHttpMethod: 'POST',
      uri: `arn:aws:apigateway:${cdk.Aws.REGION}:states:action/StartExecution`,
      options: {
        credentialsRole: invokeStateMachineRole,
        requestTemplates: {
          'application/json': `{
            "input": "{\\"order\\": $util.escapeJavaScript($input.json('$'))}",
            "stateMachineArn": "${myFirstStateMachine.stateMachineArn}"
          }`,
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': `{
                "statusCode": 200,
                "body": { "message": "OK!" }"
              }`,
            },
          },
        ],
      },
    }),
    {
      methodResponses: [
        {
          statusCode: '200',
        },
      ],
    });

    const createStoreItem = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'createStoreItem', {
      entry: join(__dirname, 'createStoreItem', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        TABLE_NAME: storeDB.tableName,
      },
    });

    storeDB.grantReadWriteData(createStoreItem);

    const createStoreItemResource = api.root.addResource('create-store-item');
    createStoreItemResource.addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(createStoreItem));
  }
}