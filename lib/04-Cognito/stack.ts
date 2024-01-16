import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import * as cdk from 'aws-cdk-lib';
import { join } from "path";

export class Part04CognitoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const api = new cdk.aws_apigateway.RestApi(this, 'api', {
      restApiName: 'Part04Service',
    });

    const userPool = new cdk.aws_cognito.UserPool(this, 'myFirstUserPool', {
      selfSignUpEnabled: true,
      autoVerify: {
        email: true,
      },
    });

    const userPoolClient = new cdk.aws_cognito.UserPoolClient(this, 'myFirstUserPoolClient', {
      userPool,
      authFlows: {
        userPassword: true,
      },
    });

    const authorizer = new cdk.aws_apigateway.CognitoUserPoolsAuthorizer(this, 'myFirstAuthorizer', {
      cognitoUserPools: [userPool],
      identitySource: 'method.request.header.Authorization',
    });

    const signup = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'signup', {
      entry: join(__dirname, 'signup', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });

    signup.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['cognito-idp:SignUp'],
        resources: [userPool.userPoolArn],
      })
    );

    const signin = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'signin', {
      entry: join(__dirname, 'signin', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });

    signin.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['cognito-idp:InitiateAuth', 'cognito-idp:RespondToAuthChallenge'],
        resources: [userPool.userPoolArn],
      })
    );

    const confirm = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'confirm', {
      entry: join(__dirname, 'confirm', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });

    confirm.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['cognito-idp:ConfirmSignUp'],
        resources: [userPool.userPoolArn],
      })
    );

    const secret = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'secret', {
      entry: join(__dirname, 'secret', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
    });

    api.root.addResource('sign-up').addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(signup));
    api.root.addResource('sign-in').addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(signin));
    api.root.addResource('confirm').addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(confirm));
    api.root.addResource('secret').addMethod('GET', new cdk.aws_apigateway.LambdaIntegration(secret), {
      authorizer,
      authorizationType: cdk.aws_apigateway.AuthorizationType.COGNITO,
    });
  }
}