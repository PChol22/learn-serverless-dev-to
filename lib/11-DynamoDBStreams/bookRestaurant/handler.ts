import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

import { v4 as uuid } from 'uuid';
import { Reservation } from '../types';

const client = new DynamoDBClient({});

export const handler = async ({ body }: { body: string}): Promise<{ statusCode: number, body: string }> => {
  const tableName = process.env.TABLE_NAME;

  if (tableName === undefined) {
    throw new Error('TABLE_NAME environment variable must be defined');
  }

  const {
    firstName,
    lastName,
    email,
    dateTime,
    partySize,
  } = JSON.parse(body) as Partial<Reservation>;

  if (firstName === undefined || lastName === undefined || email === undefined || dateTime === undefined || partySize === undefined) {
    return {
      statusCode: 400,
      body: 'Bad request',
    };
  }

  const reservationId = uuid();

  await client.send(new PutItemCommand({
    TableName: tableName,
    Item: {
      PK: { S: `RESERVATION` },
      SK: { S: reservationId },
      firstName: { S: firstName },
      lastName: { S: lastName },
      email: { S: email },
      partySize: { N: partySize.toString() },
      dateTime: { S: dateTime },
      status: { S: 'PENDING' },
    }
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({
      reservationId,
    }),
  };
}