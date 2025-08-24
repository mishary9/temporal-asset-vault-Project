import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activities';
import { TransactionInput } from '../models/types';

const { validateInputActivity, updateBalanceActivity, publishEventActivity } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '1 minute',
    retry: {
      initialInterval: '1 second',
      maximumAttempts: 3,
    },
  });

export async function ProcessTransactionWorkflow(
  input: TransactionInput
): Promise<string> {
  const { type } = input;

  try {
    await validateInputActivity(input.symbol, input.amount);

    await sleep('15 seconds');

    await updateBalanceActivity(input);

    await sleep('15 seconds');

    await publishEventActivity(1, input.type);
    return `${type} Succeeded`;
  } catch (err) {
    await publishEventActivity(0, input.type);
    throw err;
  }
}
