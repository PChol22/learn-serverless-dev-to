import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async ({ body }: { body: string}): Promise<{ statusCode: number, body: string }> => {
  const tableName = process.env.TABLE_NAME;

  const { itemId, quantity } = JSON.parse(body) as { itemId?: string, quantity?: number };

  if (itemId === undefined || quantity === undefined) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'itemId or quantity is undefined' }),
    }
  }

  await client.send(new PutItemCommand({
    TableName: tableName,
    Item: {
      PK: { S: 'StoreItem' },
      SK: { S: itemId },
      stock: { N: quantity.toString() }
    }
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Store item created' }),
  }
}
