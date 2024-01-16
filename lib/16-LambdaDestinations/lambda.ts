export const handler = async (): Promise<void> => {
  // 80% chance of going wrong
  // 64% counting the retry
  const success = Math.random() > 0.8; 

  if (!success) {
    throw new Error('Something went wrong!');
  }

  return Promise.resolve();
}
