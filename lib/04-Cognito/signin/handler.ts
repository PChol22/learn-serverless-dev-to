import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

export const handler = async (event: { body: string }): Promise<{ statusCode: number, body: string }> => {
  const { username, password } = JSON.parse(event.body) as { username?: string; password?: string };

  if (username === undefined || password === undefined) {
    return Promise.resolve({ statusCode: 400, body: 'Missing username or password' });
  }

  const userPoolClientId = process.env.USER_POOL_CLIENT_ID;

  const result = await client.send(new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: userPoolClientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password
    },
  }));

  const idToken = result.AuthenticationResult?.IdToken;

  if (idToken === undefined) {
    return Promise.resolve({ statusCode: 401, body: 'Authentication failed' });
  }

  return { statusCode: 200, body: idToken }
}