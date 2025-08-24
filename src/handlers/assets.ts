import { Request, Response, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Client } from '@temporalio/client';
import { client } from '../db/redis';
import { RedisKey, CryptoBalance, TransactionInput } from '../models/types';
import { getTemporalClient } from '../temporal/client';
import { ProcessTransactionWorkflow } from '../temporal/workflows';
import { DepositDto, WithdrawDto } from '../dtos';

export const getAssetsHandler: RequestHandler = async (
  req: Request,
  res: Response
) => {
  console.log(req.user);
  const walletId: string | undefined = req.user?.wallet_id;
  if (!walletId) {
    return res
      .status(403)
      .json({ message: 'Forbidden: User or wallet information is missing.' });
  }
  try {
    const cryptoBalancesKey: string = RedisKey.cryptoBalances(walletId);
    const walletBalances = await client.hGetAll(cryptoBalancesKey);
    if (!walletBalances || Object.keys(walletBalances).length === 0) {
      return res.status(200).json({ assets: [], message: 'No assets found' });
    }
    const assets: CryptoBalance[] = Object.entries(walletBalances).map(
      ([symbol, balance]) => ({
        symbol,
        balance: parseFloat(balance).toFixed(2),
      })
    );
    res
      .status(200)
      .json({ assets: assets, message: 'Assets fetched successfully' });
  } catch (error) {
    console.error('Error getting assets:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const depositHandler: RequestHandler = async (
  req: Request<any, any, DepositDto>,
  res: Response
) => {
  const walletId: string | undefined = req.user?.wallet_id;
  if (!walletId) {
    return res
      .status(403)
      .json({ message: 'Forbidden: User or wallet information is missing.' });
  }
  try {
    const { symbol, amount } = req.body;
    if (!walletId) {
      return res
        .status(403)
        .json({ message: 'Forbidden: User or wallet information is missing.' });
    }

    const temporalClient: Client = getTemporalClient();
    const input: TransactionInput = {
      walletId,
      symbol,
      amount: amount,
      type: 'deposit',
    };

    const workflowId = `transaction-${uuidv4()}`;
    await temporalClient.workflow.start(ProcessTransactionWorkflow, {
      args: [input],
      taskQueue: 'transactions',
      workflowId: workflowId,
    });
    res.status(202).json({
      message: 'Deposit process initiated.',
      workflowId: workflowId,
    });
  } catch (error) {
    console.error('Failed to start deposit workflow:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const withdrawHandler: RequestHandler = async (
  req: Request<any, any, WithdrawDto>,
  res: Response
) => {
  const walletId: string | undefined = req.user?.wallet_id;
  if (!walletId) {
    return res
      .status(403)
      .json({ message: 'Forbidden: User or wallet information is missing.' });
  }
  try {
    const symbol: string = req.body.symbol;
    const amount: string = req.body.amount;
    const temporalClient = getTemporalClient();

    const input: TransactionInput = {
      walletId,
      symbol,
      amount: amount,
      type: 'withdraw',
    };

    const workflowId = `transaction-${uuidv4()}`;

    await temporalClient.workflow.start(ProcessTransactionWorkflow, {
      args: [input],
      taskQueue: 'transactions',
      workflowId: workflowId,
    });

    res.status(202).json({
      message: 'Withdrawal process initiated.',
      workflowId: workflowId,
    });
  } catch (error) {
    console.error('Failed to start withdrawal workflow:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
