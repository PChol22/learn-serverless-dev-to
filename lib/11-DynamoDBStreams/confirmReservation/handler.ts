import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({});

export const handler = async ({ pathParameters }: { pathParameters: { reservationId: string }}): Promise<{ statusCode: number, body: string, headers: unknown }> => {
  const tableName = process.env.TABLE_NAME;

  if (tableName === undefined) {
    throw new Error('TABLE_NAME environment variable must be defined');
  }

  await client.send(new UpdateItemCommand({
    TableName: tableName,
    Key: {
      PK: { S: `RESERVATION` },
      SK: { S: pathParameters.reservationId },
    },
    UpdateExpression: 'SET #status = :status',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':status': { S: 'CONFIRMED' },
    },
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({
      reservationId: pathParameters.reservationId,
    }),
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  };
}