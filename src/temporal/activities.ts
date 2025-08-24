import { Context } from '@temporalio/activity';
import { client as redisClient } from '../db/redis';
import { RedisKey, RedisChannel, TransactionInput } from '../models/types'; 

export async function validateInputActivity(
  symbol: string,
  amount: string
): Promise<void> {
  const activityContext = Context.current();
  activityContext.log.info('Starting input validation', { symbol, amount });

  if (
    amount.trim() === '' ||
    parseFloat(amount) <= 0 ||
    !Number.isFinite(parseFloat(amount))
  ) {
    activityContext.log.error('Invalid amount provided', { amount });
    throw new Error('Transaction amount must be a positive number.');
  }
  if (symbol.trim() === '' || symbol.length > 3) {
    activityContext.log.error('Invalid symbol provided', { symbol });
    throw new Error(
      'Currency symbol must be a non-empty string and less than 3 characters.'
    );
  }
}

export async function updateBalanceActivity(
  input: TransactionInput
): Promise<void> {
  const { walletId, symbol, amount, type } = input;
  const activityContext = Context.current();
  activityContext.log.info(`Updating balance for user ${walletId}`, { input });
  const balanceKey = RedisKey.cryptoBalances(walletId);
  if (type === 'withdraw') {
    try {
      await redisClient.watch(balanceKey);
      const currentBalanceStr = await redisClient.hGet(balanceKey, symbol);
      const currentBalance = parseFloat(currentBalanceStr || '0');
      if (currentBalance < parseFloat(amount)) {
        activityContext.log.error('Insufficient balance', {
          currentBalance,
          requestedAmount: parseFloat(amount),
        });
        throw new Error('Insufficient balance.');
      }

      const newBalance = currentBalance - parseFloat(amount);
      let result;
      if (newBalance <= 0) {
        result = await redisClient.multi().hDel(balanceKey, symbol).exec();
      } else {
        result = await redisClient
          .multi()
          .hIncrByFloat(balanceKey, symbol, -parseFloat(amount))
          .exec();
      }
      if (result === null) {
        throw new Error(
          'Balance was modified by another transaction. Please retry.'
        );
      }
    } catch (error) {
      await redisClient.unwatch();
      throw error;
    }
  } else {
    await redisClient.hIncrByFloat(balanceKey, symbol, parseFloat(amount));
  }
}

export async function publishEventActivity(
  status: number,
  type: string
): Promise<void> {
  const activityContext = Context.current();

  let channel: string;
  if (type === 'deposit') {
    channel =
      status === 1 ? RedisChannel.DEPOSIT_SUCCESS : RedisChannel.DEPOSIT_FAILED;
  } else if (type === 'withdraw') {
    channel =
      status === 1
        ? RedisChannel.WITHDRAW_SUCCESS
        : RedisChannel.WITHDRAW_FAILED;
  } else {
    throw new Error(`Unsupported transaction type: ${type}`);
  }

  activityContext.log.info(
    `Publishing event to channel '${channel}' with status ${status}`
  );

  const message = JSON.stringify({
    event: status === 1 ? 'success' : 'failed',
    type: type,
    timestamp: new Date().toISOString(),
  });

  await redisClient.publish(channel, message);
}
