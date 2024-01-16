import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import * as cdk from 'aws-cdk-lib';
import { join } from "path";

export class Part03S3Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Provision a new REST API Gateway
    const api = new cdk.aws_apigateway.RestApi(this, 'myFirstApi', {
      restApiName: 'Part03Service',
    });

    const articlesBucket = new cdk.aws_s3.Bucket(this, 'articlesBucket', {
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          transitions: [
            {
              storageClass: cdk.aws_s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(0),
            }
          ]
        }
      ],
      enforceSSL: true,
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
    });

    const articlesDatabase = new cdk.aws_dynamodb.Table(this, 'articlesDatabase', {
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

    const publishArticle = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'publishArticle', {
      entry: join(__dirname, 'publishArticle', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        BUCKET_NAME: articlesBucket.bucketName,
        TABLE_NAME: articlesDatabase.tableName,
      },
    });

    const listArticles = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'listArticles', {
      entry: join(__dirname, 'listArticles', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        BUCKET_NAME: articlesBucket.bucketName,
        TABLE_NAME: articlesDatabase.tableName,
      },
    });

    const getArticle = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'getArticle', {
      entry: join(__dirname, 'getArticle', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        BUCKET_NAME: articlesBucket.bucketName,
      },
    });

    articlesBucket.grantWrite(publishArticle);
    articlesDatabase.grantWriteData(publishArticle);

    articlesDatabase.grantReadData(listArticles);
    
    articlesBucket.grantRead(getArticle);

    const articlesResource = api.root.addResource('articles');
    articlesResource.addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(publishArticle));
    articlesResource.addMethod('GET', new cdk.aws_apigateway.LambdaIntegration(listArticles));
    articlesResource.addResource('{id}').addMethod('GET', new cdk.aws_apigateway.LambdaIntegration(getArticle));
  }
}