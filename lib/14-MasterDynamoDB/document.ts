import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(ddbClient);
const tableName = process.env.TABLE_NAME ?? '';

export const createUser = async (event: { body: string }) => {
  const { username, email, age, adult } = JSON.parse(event.body) as { username: string, email: string, age: number, adult: boolean };

  await documentClient.send(new PutCommand({
    TableName: tableName,
    Item: {
      PK: 'USER',
      SK: username,
      email,
      age,
      adult,
    },
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'User created successfully',
    })
  }
};

export const listUsers = async () => {
  const { Items = [] } = await documentClient.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': 'USER',
    },
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({
      users: Items.map(user => ({
        username: user.SK,
        email: user.email,
        age: user.age,
        adult: user.adult,
      }))
    })
  };
};
