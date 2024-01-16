import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { v4 as uuidv4 } from 'uuid';

const client = new SQSClient({});

export const handler = async ({ body }: { body: string }): Promise<{ statusCode: number; body: string }> => {
  const queueUrl = process.env.QUEUE_URL;

  if (queueUrl === undefined) {
    throw new Error('Missing environment variables');
  }

  const { itemName, quantity, username, userEmail } = JSON.parse(body) as {
    itemName?: string,
    quantity?: number,
    username?: string,
    userEmail?: string,
  };

  if (itemName === undefined || quantity === undefined || username === undefined || userEmail === undefined) {
    return Promise.resolve({
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing required parameters' })
    })
  }

  await client.send(new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify({ itemName, quantity, username, userEmail }),
    MessageGroupId: 'ORDER_REQUESTED',
    MessageDeduplicationId: uuidv4()
  }));

  return Promise.resolve({
    statusCode: 200,
    body: JSON.stringify({ message: 'Order requested' })
  });
};
