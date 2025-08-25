import dotenv from 'dotenv';
import express from 'express';
import { connectRedis } from './db/redis';
import { connectTemporal } from './temporal/client';
import authRoutes from './routes/auth';
import assetsRoutes from './routes/assets';
import transactionRoutes from './routes/transactions';

async function startApiServer() {
  dotenv.config();

  console.log(' Connecting to Redis');
  await connectRedis();
  console.log(' Redis connected');

  console.log(' Connecting to Temporal client');
  await connectTemporal();
  console.log(' Temporal client connected');

  const app = express();
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/assets', assetsRoutes);
  app.use('/api/', transactionRoutes);

  const port: number = parseInt(process.env.EXPRESS_APP_PORT || '3000');
  app.listen(port, () => {
    console.log(` API Server is running on port ${port}`);
  });
}

startApiServer().catch(error => {
  console.error(' Failed to start API server:', error);
  process.exit(1);
});
