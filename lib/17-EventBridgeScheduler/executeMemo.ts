export const handler = async ({ memo }: { memo: string }): Promise<void> => {
  console.log(memo);

  return Promise.resolve();
}