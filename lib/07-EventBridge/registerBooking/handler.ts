import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const ddbClient = new DynamoDBClient({});

export const handler = async (event: {
  detail: {
    destination: string,
    flightDate: string,
    numberOfSeats: number,
  }
}): Promise<void> => {
  const { destination, flightDate, numberOfSeats } = event.detail;

  await ddbClient.send(
    new UpdateItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        PK: { S: `DESTINATION#${destination}` },
        SK: { S: flightDate },
      },
      UpdateExpression: 'SET availableSeats = availableSeats - :numberOfSeats',
      ExpressionAttributeValues: {
        ':numberOfSeats': { N: `${numberOfSeats}` },
      },
    }),
  );
};
