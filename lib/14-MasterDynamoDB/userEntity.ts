import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Entity, Table } from "dynamodb-toolbox";

const ddbClient = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(ddbClient);

const table = new Table({
  // WARNING: Only import this file in Lambda functions that have this environment variable
  name: process.env.TABLE_NAME ?? '',
  partitionKey: 'PK',
  sortKey: 'SK',
  DocumentClient: documentClient,
});

export const UserEntity = new Entity({
  table,
  name: 'USER',
  attributes: {
    PK: { partitionKey: true, default: 'USER', hidden: true },
    SK: { sortKey: true, default: ({ username }: { username: string }) => username, hidden: true },
    email: { type: 'string', required: true },
    age: { type: 'number', required: true },
    adult: { type: 'boolean', required: true },
    username: { type: 'string', required: true },
  },
})