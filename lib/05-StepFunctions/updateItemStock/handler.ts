import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async ({ item : { itemId, quantity } }: { item: { itemId: string, quantity: number } }): Promise<void> => {
  const tableName = process.env.TABLE_NAME;

  await client.send(new UpdateItemCommand({
    TableName: tableName,
    Key: {
      PK: { S: 'StoreItem' },
      SK: { S: itemId }
    },
    UpdateExpression: 'SET stock = stock - :quantity',
    ExpressionAttributeValues: {
      ':quantity': { N: quantity.toString() }
    },
  }));
}
