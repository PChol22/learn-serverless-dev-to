import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const sesClient = new SESv2Client({});

export const handler = async (event: {
  detail: {
    destination: string,
    flightDate: string,
    numberOfSeats: number,
    bookerEmail: string,
  }
}): Promise<void> => {
  const { destination, flightDate, numberOfSeats, bookerEmail } = event.detail;

  const senderEmail = process.env.SENDER_EMAIL;
  const templateName = process.env.TEMPLATE_NAME;

  if (senderEmail === undefined || templateName === undefined) {
    throw new Error('Missing environment variables');
  }

  await sesClient.send(new SendEmailCommand({
    FromEmailAddress: senderEmail,
    Content: {
      Template: {
        TemplateName: templateName,
        TemplateData: JSON.stringify({ destination, flightDate, numberOfSeats }),
      }
    },
    Destination: {
      ToAddresses: [bookerEmail],
    }
  }));
};
