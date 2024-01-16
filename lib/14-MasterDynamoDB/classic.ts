import { DynamoDBClient, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";

const ddbClient = new DynamoDBClient({});
const tableName = process.env.TABLE_NAME ?? '';

export const createUser = async (event: { body: string }) => {
  const { username, email, age, adult } = JSON.parse(event.body) as { username: string, email: string, age: number, adult: boolean };

  await ddbClient.send(new PutItemCommand({
    TableName: tableName,
    Item: {
      PK: { S: 'USER' },
      SK: { S: username },
      email: { S: email },
      age: { N: age.toString() },
      adult: { BOOL: adult },
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
  const { Items = [] } = await ddbClient.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': { S: 'USER' },
    },
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({
      users: Items.map(user => ({
        username: user.SK.S,
        email: user.email.S,
        age: +(user.age.N ?? '0'),
        adult: user.adult.BOOL ?? false,
      }))
    })
  };
};
