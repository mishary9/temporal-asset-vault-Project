import dotenv from 'dotenv';
import { Worker } from '@temporalio/worker';
import { connectRedis } from '../db/redis';
import * as activities from './activities';

async function startWorker() {
  dotenv.config();

  console.log('Connecting to Redis...');
  await connectRedis();
  console.log('Redis connected');

  console.log('Creating Temporal worker...');
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'transactions',
  });

  console.log(' Temporal worker created for "transactions" task queue');

  await worker.run();
}

startWorker().catch(err => {
  console.error(' Temporal worker failed to start:', err);
  process.exit(1);
});
