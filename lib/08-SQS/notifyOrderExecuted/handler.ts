import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const client = new SESv2Client({});

export const handler = async (event: {
  detail: {
    itemName: string,
    quantity: number,
    username: string,
    userEmail: string,
  }
}): Promise<void> => {
  const senderEmail = process.env.SENDER_EMAIL;
  const templateName = process.env.TEMPLATE_NAME;

  if (senderEmail === undefined || templateName === undefined) {
    throw new Error('Missing environment variables');
  }

  const { itemName, quantity, username, userEmail } = event.detail;

  await client.send(new SendEmailCommand({
    FromEmailAddress: senderEmail,
    Content: {
      Template: {
        TemplateName: templateName,
        TemplateData: JSON.stringify({ itemName, quantity, username }),
      }
    },
    Destination: {
      ToAddresses: [userEmail],
    }
  }));
};
