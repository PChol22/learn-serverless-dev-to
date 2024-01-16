import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const client = new EventBridgeClient({});

export const handler = async (event: {
  Records: {
    body: string;
  }[];
}): Promise<void> => {
  const eventBusName = process.env.EVENT_BUS_NAME;

  if (eventBusName === undefined) {
    throw new Error('Missing environment variables');
  }

  const { body } = event.Records[0];

  console.log('Communication with external API started...');
  await new Promise(resolve => setTimeout(resolve, 20000));
  console.log('Communication with external API finished!');

  await client.send(new PutEventsCommand({
    Entries: [
      {
        EventBusName: eventBusName,
        Source: 'notifyOrderExecuted',
        DetailType: 'orderExecuted',
        Detail: body,
      }
    ]
  }));
};
