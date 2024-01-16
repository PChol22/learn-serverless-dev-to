import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { Reservation } from '../types';

const client = new SESv2Client({});

export const handler = async ({ detail }: { detail: Reservation }): Promise<void> => {
  const templateName = process.env.TEMPLATE_NAME;
  const fromEmailAddress = process.env.FROM_EMAIL_ADDRESS;

  if (templateName === undefined || fromEmailAddress === undefined) {
    throw new Error('TEMPLATE_NAME and FROM_EMAIL_ADDRESS environment variables must be defined');
  }

  await client.send(new SendEmailCommand({
    FromEmailAddress: fromEmailAddress,
    Destination: {
      ToAddresses: [detail.email],
    },
    Content: {
      Template: {
        TemplateName: templateName,
        TemplateData: JSON.stringify({
          firstName: detail.firstName,
          lastName: detail.lastName,
          dateTime: detail.dateTime,
          partySize: detail.partySize,
        }),
      },
    },
  }));
}
