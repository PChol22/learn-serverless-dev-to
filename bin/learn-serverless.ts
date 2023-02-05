#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LearnServerlessStack } from '../lib/learn-serverless-stack';

const app = new cdk.App();
new LearnServerlessStack(app, 'LearnServerlessStack', {
  env: { region: 'eu-west-1' }
});