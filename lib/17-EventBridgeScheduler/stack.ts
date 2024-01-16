import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import * as cdk from 'aws-cdk-lib';
import { join } from "path";

export class Part17EventBridgeSchedulerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Lambda function triggered by scheduler
    const executeMemo = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'ExecuteMemo', {
      entry: join(__dirname, 'executeMemo.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk']
      },
    });

    // Create role for scheduler to invoke executeMemo
    const invokeExecuteMemoRole = new cdk.aws_iam.Role(this, 'InvokeMemoRole', {
      assumedBy: new cdk.aws_iam.ServicePrincipal('scheduler.amazonaws.com'),
    });
    invokeExecuteMemoRole.addToPolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [executeMemo.functionArn]
    }));

    // Lambda function that schedules executeMemo
    const addMemo = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'AddMemo', {
      entry: join(__dirname, 'addMemo.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk']
      },
      environment: {
        SCHEDULE_TARGET_ARN: executeMemo.functionArn,
        SCHEDULE_ROLE_ARN: invokeExecuteMemoRole.roleArn,
      },
    });

    // Allow addMemo to create a scheduler
    addMemo.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['scheduler:CreateSchedule'],
        resources: ['*'],
      }),
    );

    // Allow addMemo to pass the invokeExecuteMemoRole to the scheduler
    addMemo.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['iam:PassRole'],
        resources: [invokeExecuteMemoRole.roleArn],
      }),
    );

    // Trigger addMemo via API Gateway
    const api = new cdk.aws_apigateway.RestApi(this, 'Api', {
      restApiName: 'Part17Service'
    });
    api.root.addResource('addMemo').addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(addMemo));
  }
}