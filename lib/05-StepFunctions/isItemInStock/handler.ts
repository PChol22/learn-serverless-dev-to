import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async ({ item : { itemId, quantity } }: { item: { itemId: string, quantity: number } }): Promise<void> => {
  const tableName = process.env.TABLE_NAME;

  const { Item } = await client.send(new GetItemCommand({
    TableName: tableName,
    Key: {
      PK: { S: 'StoreItem' },
      SK: { S: itemId }
    }
  }));

  const stock = Item?.stock.N;

  if (stock === undefined || +stock < quantity) {
    throw new Error('Item not in stock');
  }
}
