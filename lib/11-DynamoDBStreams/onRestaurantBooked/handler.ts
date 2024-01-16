import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { Reservation } from '../types';

const client = new SESv2Client({});
const RESTAURANT_OWNER_EMAIL_ADDRESS = 'pierrech@theodo.fr';

export const handler = async ({ detail }: { detail: Reservation }): Promise<void> => {
  const templateName = process.env.TEMPLATE_NAME;
  const apiURL = process.env.API_URL;
  const fromEmailAddress = process.env.FROM_EMAIL_ADDRESS;

  if (templateName === undefined || apiURL === undefined || fromEmailAddress === undefined) {
    throw new Error('TEMPLATE_NAME, API_URL and FROM_EMAIL_ADDRESS environment variables must be defined');
  }

  await client.send(new SendEmailCommand({
    FromEmailAddress: fromEmailAddress,
    Destination: {
      ToAddresses: [RESTAURANT_OWNER_EMAIL_ADDRESS],
    },
    Content: {
      Template: {
        TemplateName: templateName,
        TemplateData: JSON.stringify({
          firstName: detail.firstName,
          lastName: detail.lastName,
          dateTime: detail.dateTime,
          partySize: detail.partySize,
          apiURL,
          reservationId: detail.id,
        }),
      },
    },
  }));
}
