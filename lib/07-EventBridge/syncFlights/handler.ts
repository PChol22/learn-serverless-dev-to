import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const DESTINATIONS = [
  'CDG',
  'LHR',
  'FRA',
  'IST',
  'AMS',
  'FCO',
  'LAX',
];

const client = new DynamoDBClient({});

export const handler = async (): Promise<void> => {
  const tableName = process.env.TABLE_NAME;

  if (tableName === undefined) {
    throw new Error('Table name not set');
  }

  const flightDate = new Date().toISOString().slice(0, 10);

  await Promise.all(DESTINATIONS.map(
    async (destination) => client.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          PK: { S: `DESTINATION#${destination}` },
          SK: { S: flightDate },
          availableSeats: { N: '2' },
        },
      }),
    ),
  ));
};