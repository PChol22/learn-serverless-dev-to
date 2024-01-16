import { ExecuteStatementCommand, RDSDataClient } from "@aws-sdk/client-rds-data";

const rdsDataClient = new RDSDataClient({});

export const handler = async (): Promise<{ statusCode: number; body: string }> => {
  const secretArn = process.env.SECRET_ARN;
  const resourceArn = process.env.CLUSTER_ARN;

  if (secretArn === undefined || resourceArn === undefined ) {
    throw new Error('Missing environment variables');
  }

  const { records } = await rdsDataClient.send(
    new ExecuteStatementCommand({
      secretArn,
      resourceArn,
      database: 'my_database',
      sql: 'SELECT * FROM users;',
    }),
  );

  const users = records?.map(([{ stringValue: id }, { stringValue: firstName }, { stringValue: lastName }]) => ({
    id,
    firstName,
    lastName,
  })) ?? [];

  return {
    statusCode: 200,
    body: JSON.stringify(users, null, 2),
  }
}
