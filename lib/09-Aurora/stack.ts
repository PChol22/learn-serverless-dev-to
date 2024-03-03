import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import * as cdk from 'aws-cdk-lib';
import { join } from "path";


export class Part09AuroraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const api = new cdk.aws_apigateway.RestApi(this, 'api', {
      restApiName: 'Part09Service',
    });

    const dbSecret = new cdk.aws_rds.DatabaseSecret(this, 'AuroraSecret', {
      username: 'admin',
    });
        
    const cluster = new cdk.aws_rds.ServerlessCluster(this, 'AuroraCluster', {
      engine: cdk.aws_rds.DatabaseClusterEngine.AURORA_MYSQL,
      credentials: cdk.aws_rds.Credentials.fromSecret(dbSecret),
      defaultDatabaseName: 'my_database',
      enableDataApi: true,
      scaling: {
        autoPause: cdk.Duration.minutes(10),
        minCapacity: 2,
        maxCapacity: 16,
      }
    });

    const migrationsTable = new cdk.aws_dynamodb.Table(this, 'migrationsTable', {
      partitionKey: {
        name: "PK",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const runMigrations = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'runMigrations', {
      entry: join(__dirname, 'runMigrations', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        DYNAMODB_TABLE_NAME: migrationsTable.tableName,
        CLUSTER_ARN: cluster.clusterArn,
        SECRET_ARN: cluster.secret?.secretArn ?? '',
      },
      timeout: cdk.Duration.seconds(180),
    });

    migrationsTable.grantReadWriteData(runMigrations);
    runMigrations.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: [
        'rds-data:BatchExecuteStatement',
        'rds-data:BeginTransaction',
        'rds-data:CommitTransaction',
        'rds-data:ExecuteStatement',
        'rds-data:RollbackTransaction',
      ],
      resources: [cluster.clusterArn],
    }));
    runMigrations.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: [
        'secretsmanager:GetSecretValue',
        'secretsmanager:DescribeSecret'
      ],
      resources: [dbSecret.secretArn],
    }));

    const addUser = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'addUser', {
      entry: join(__dirname, 'addUser', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        CLUSTER_ARN: cluster.clusterArn,
        SECRET_ARN: cluster.secret?.secretArn ?? '',
      },
      timeout: cdk.Duration.seconds(30),
    });

    addUser.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: [
        'rds-data:BatchExecuteStatement',
        'rds-data:BeginTransaction',
        'rds-data:CommitTransaction',
        'rds-data:ExecuteStatement',
        'rds-data:RollbackTransaction',
      ],
      resources: [cluster.clusterArn],
    }));
    addUser.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: [
        'secretsmanager:GetSecretValue',
        'secretsmanager:DescribeSecret'
      ],
      resources: [dbSecret.secretArn],
    }));

    const getUsers = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'getUsers', {
      entry: join(__dirname, 'getUsers', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        CLUSTER_ARN: cluster.clusterArn,
        SECRET_ARN: cluster.secret?.secretArn ?? '',
      },
      timeout: cdk.Duration.seconds(30),
    });

    getUsers.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: [
        'rds-data:BatchExecuteStatement',
        'rds-data:BeginTransaction',
        'rds-data:CommitTransaction',
        'rds-data:ExecuteStatement',
        'rds-data:RollbackTransaction',
      ],
      resources: [cluster.clusterArn],
    }));
    getUsers.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: [
        'secretsmanager:GetSecretValue',
        'secretsmanager:DescribeSecret'
      ],
      resources: [dbSecret.secretArn],
    }));

    api.root.addResource('add-user').addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(addUser)); 
    api.root.addResource('get-users').addMethod('GET', new cdk.aws_apigateway.LambdaIntegration(getUsers));

  }
}