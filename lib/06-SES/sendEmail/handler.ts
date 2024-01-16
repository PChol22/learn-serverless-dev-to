import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'

const sesClient = new SESv2Client({});

export const handler = async ({ body }: { body: string }) => {
  const { username, email, message } = JSON.parse(body) as { username?: string; email?: string; message?: string };
  const senderEmail = process.env.SENDER_EMAIL;
  const templateName = process.env.TEMPLATE_NAME;

  if (!username || !email || !message || !senderEmail || !templateName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing parameters' }),
    };
  }

  const formattedMessage = message.replace(/\n/g, '<br />');

  const result = await sesClient.send(new SendEmailCommand({
    FromEmailAddress: senderEmail,
    Content: {
      Template: {
        TemplateName: templateName,
        TemplateData: JSON.stringify({ username, message: formattedMessage }),
      }
    },
    Destination: {
      ToAddresses: [email],
    }
  }));

  console.log(result);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Email sent' }),
  };
};
