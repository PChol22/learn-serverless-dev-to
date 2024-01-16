import { ExecuteStatementCommand, RDSDataClient } from "@aws-sdk/client-rds-data";
import { v4 as uuid } from 'uuid';

const rdsDataClient = new RDSDataClient({});

export const handler = async ({ body }: { body: string }): Promise<{ statusCode: number; body: string }> => {
  const secretArn = process.env.SECRET_ARN;
  const resourceArn = process.env.CLUSTER_ARN;

  if (secretArn === undefined || resourceArn === undefined ) {
    throw new Error('Missing environment variables');
  }

  const { firstName, lastName } = JSON.parse(body) as { firstName?: string; lastName?: string; };

  if (firstName === undefined || lastName === undefined) {
    return {
      statusCode: 400,
      body: 'Missing firstName or lastName',
    }
  }

  const userId = uuid();

  await rdsDataClient.send(
    new ExecuteStatementCommand({
      secretArn,
      resourceArn,
      database: 'my_database',
      sql: 'CREATE TABLE IF NOT EXISTS users (id VARCHAR(255) NOT NULL PRIMARY KEY, firstName VARCHAR(255) NOT NULL, lastName VARCHAR(255) NOT NULL); INSERT INTO users (id, firstName, lastName) VALUES (:id, :firstName, :lastName);',
      parameters: [
        { name: 'id', value: { stringValue: userId } },
        { name: 'firstName', value: { stringValue: firstName } },
        { name: 'lastName', value: { stringValue: lastName } },
      ],
    }),
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      userId
    }, null, 2),
  }
}
