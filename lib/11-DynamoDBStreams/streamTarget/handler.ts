import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge"
import { Reservation } from "../types";

type InputProps = {
  Records: {
    eventName: string,
    dynamodb: {
      NewImage: {
        PK: { S: string },
        SK: { S: string },
        email: { S: string },
        firstName: { S: string },
        lastName: { S: string },
        dateTime: { S: string },
        partySize: { N: string },
        status: { S: string },
      },
    }
  }[]
}

const client = new EventBridgeClient({});

export const handler = async ({ Records }: InputProps): Promise<void> => {
  const eventBusName = process.env.EVENT_BUS_NAME;

  if (eventBusName === undefined) {
    throw new Error('EVENT_BUS_NAME environment variable is not set');
  }

  await Promise.all(Records.map(async ({ dynamodb, eventName }) => {
    if (eventName !== 'INSERT' && eventName !== 'MODIFY') {
      return;
    }
    
    const { SK, email, firstName, lastName, dateTime, partySize } = dynamodb.NewImage;

    const eventDetail: Reservation = {
      id: SK.S,
      firstName: firstName.S,
      lastName: lastName.S,
      email: email.S,
      dateTime: dateTime.S,
      partySize: +partySize.N,
    }

    await client.send(new PutEventsCommand({
      Entries: [
        {
          EventBusName: eventBusName,
          Source: 'StreamTarget',
          DetailType: eventName === 'INSERT' ? 'OnRestaurantBooked' : 'OnReservationConfirmed',
          Detail: JSON.stringify(eventDetail),
        },
      ],
    }));
  }));
}
