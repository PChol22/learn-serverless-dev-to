import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { ExecuteStatementCommand, RDSDataClient } from "@aws-sdk/client-rds-data";

const migrations: { id: string, statement: string }[] = [
  {
    id: 'migration-1',
    statement: 'CREATE TABLE IF NOT EXISTS users (id VARCHAR(255) NOT NULL PRIMARY KEY, firstName VARCHAR(255) NOT NULL, lastName VARCHAR(255) NOT NULL);',
  }
];

const rdsDataClient = new RDSDataClient({});
const dynamoDBClient = new DynamoDBClient({});

export const handler = async (): Promise<void> => {
  const secretArn = process.env.SECRET_ARN;
  const resourceArn = process.env.CLUSTER_ARN;
  const dynamoDBTableName = process.env.DYNAMODB_TABLE_NAME;

  if (secretArn === undefined || resourceArn === undefined || dynamoDBTableName === undefined) {
    throw new Error('Missing environment variables');
  }

  await rdsDataClient.send(
    new ExecuteStatementCommand({
      secretArn,
      resourceArn,
      sql: `CREATE DATABASE IF NOT EXISTS my_database`,
    }),
  );

  // Run migrations in order
  for (const { id, statement } of migrations) {
    // Check if migration has already been executed
    const { Item: migration } = await dynamoDBClient.send(
      new GetItemCommand({
        TableName: dynamoDBTableName,
        Key: {
          PK: { S: 'MIGRATION' },
          SK: { S: id },
        },
      }),
    );

    if (migration !== undefined) {
      continue;
    }

    // Execute migration
    await rdsDataClient.send(
      new ExecuteStatementCommand({
        secretArn,
        resourceArn,
        database: 'my_database',
        sql: statement,
      }),
    );

    // Mark migration as executed
    await dynamoDBClient.send(
      new PutItemCommand({
        TableName: dynamoDBTableName,
        Item: {
          PK: { S: 'MIGRATION' },
          SK: { S: id },
        },
      }),
    );

    console.log(`Migration ${id} executed successfully`)
  }
}