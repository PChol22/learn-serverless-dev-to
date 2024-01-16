import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from 'uuid';

const client = new DynamoDBClient({});

export const handler = async ({ order }: { order: { itemId: string, quantity: number }[] }): Promise<void> => {
  const tableName = process.env.TABLE_NAME;

  await client.send(new PutItemCommand({
    TableName: tableName,
    Item: {
      PK: { S: 'Order' },
      SK: { S: uuid() },
      order: { L: order.map(({ itemId, quantity }) => ({ M: { itemId: { S: itemId }, quantity: { N: quantity.toString() } } })) }
    }
  }));
}
