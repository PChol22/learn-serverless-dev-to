import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const ddbClient = new DynamoDBClient({});
const eventBridgeClient = new EventBridgeClient({});


export const handler = async ({ body }: { body: string }): Promise<{ statusCode: number, body: string}> => {
  const tableName = process.env.TABLE_NAME;
  const eventBusName = process.env.EVENT_BUS_NAME;

  if (tableName === undefined || eventBusName === undefined) {
    throw new Error('Missing environment variables');
  }

  const { destination, flightDate, numberOfSeats, bookerEmail } = JSON.parse(body) as { destination?: string, flightDate?: string, numberOfSeats?: number, bookerEmail?: string };

  if (destination === undefined || flightDate === undefined || numberOfSeats === undefined || bookerEmail === undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Missing required parameters',
      }),
    }
  }

  const { Item } = await ddbClient.send(
    new GetItemCommand({
      TableName: tableName,
      Key: {
        PK: { S: `DESTINATION#${destination}` },
        SK: { S: flightDate },
      },
    }),
  );

  const availableSeats = Item?.availableSeats?.N;

  if (availableSeats === undefined) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: 'Flight not found',
      }),
    }
  }
  
  if (+availableSeats < numberOfSeats) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Not enough seats for this flight',
      }),
    }
  }

  await eventBridgeClient.send(new PutEventsCommand({
    Entries: [
      {
        Source: 'bookFlight',
        DetailType: 'flightBooked',
        EventBusName: eventBusName,
        Detail: JSON.stringify({
          destination,
          flightDate,
          numberOfSeats,
          bookerEmail,
        }),
      }
    ]
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Processing flight booking',
    }),
  }
};  