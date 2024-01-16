import { UserEntity } from "./userEntity";

export const createUser = async (event: { body: string }) => {
  const { username, email, age, adult } = JSON.parse(event.body) as { username: string, email: string, age: number, adult: boolean };

  await UserEntity.put({
    username,
    email,
    age,
    adult,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'User created successfully',
    })
  }
};

export const listUsers = async () => {
  const { Items = [] } = await UserEntity.query('USER');

  return {
    statusCode: 200,
    body: JSON.stringify({
      users: Items.map(user => ({
        username: user.username,
        email: user.email,
        age: user.age,
        adult: user.adult,
      }))
    })
  };
};
