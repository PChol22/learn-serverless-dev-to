import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

export const handler = async (event: { body: string }): Promise<{ statusCode: number, body: string }> => {
  const { username, password, email } = JSON.parse(event.body) as { username?: string; password?: string; email?: string };

  if (username === undefined || password === undefined || email === undefined) {
    return Promise.resolve({ statusCode: 400, body: 'Missing username or password' });
  }

  const userPoolClientId = process.env.USER_POOL_CLIENT_ID;

  await client.send(new SignUpCommand({
    ClientId: userPoolClientId,
    Username: username,
    Password: password,
    UserAttributes: [
      {
        Name: 'email',
        Value: email
      }
    ]
  }));

  return { statusCode: 200, body: 'User created' };
};
