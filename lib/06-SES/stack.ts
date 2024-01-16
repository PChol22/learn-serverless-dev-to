import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

import * as cdk from 'aws-cdk-lib';
import { join } from "path";

import { emailHtmlTemplate } from './emailHtmlTemplate';

export class Part06SESStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const api = new cdk.aws_apigateway.RestApi(this, 'api', {
      restApiName: 'Part06Service',
    });

    // Use your own domain name
    const DOMAIN_NAME = 'pchol.fr';

    // Uncomment this part to create a new hosted zone
    /*const hostedZone = new cdk.aws_route53.HostedZone(this, 'hostedZone', {
      zoneName: DOMAIN_NAME,
    });*/

    // The hosted zone already exists on my personal account
    // I do not create it in this repo
    // Comment this part or use your own already existing hosted zone by changing the ID
    const HOSTED_ZONE_ID = 'Z03300451ZPNQ7JFRYW48';
    const hostedZone = cdk.aws_route53.HostedZone.fromHostedZoneAttributes(this, 'hostedZone', {
      hostedZoneId: HOSTED_ZONE_ID,
      zoneName: DOMAIN_NAME,
    });

    const identity = new cdk.aws_ses.EmailIdentity(this, 'sesIdentity', {
      identity: cdk.aws_ses.Identity.publicHostedZone(hostedZone)
    });

    /*
    If you want to send emails for free, use a real email address to create the SES identity.

    const MY_EMAIL_ADDRESS = 'john@gmail.com';
    const identity = new cdk.aws_ses.EmailIdentity(this, 'sesIdentity', {
      identity: cdk.aws_ses.Identity.email(MY_EMAIL_ADDRESS)
    });
    */

    const emailTemplate = new cdk.aws_ses.CfnTemplate(this, 'emailTemplate', {
      template: {
        htmlPart: emailHtmlTemplate,
        subjectPart: 'Hello {{username}}!',
        templateName: 'myFirstTemplate',
      }
    });

    const sendEmail = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'sendEmail', {
      entry: join(__dirname, 'sendEmail', 'handler.ts'),
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      bundling: {
        externalModules: ['@aws-sdk'],
      },
      environment: {
        SENDER_EMAIL: `contact@${identity.emailIdentityName}`,
        TEMPLATE_NAME: emailTemplate.ref,
      },
    });

    sendEmail.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ['ses:SendTemplatedEmail'],
        resources: [`*`],
      })
    );

    const sendEmailResource = api.root.addResource('send-email');
    sendEmailResource.addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(sendEmail));
  }
}