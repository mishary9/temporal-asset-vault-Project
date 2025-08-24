import { Connection, Client } from '@temporalio/client';

let connection: Connection | null = null;
let client: Client | null = null;

export async function connectTemporal(): Promise<void> {
  try {
    connection = await Connection.connect();
    client = new Client({ connection });
    console.log('Temporal client connected');
  } catch (error) {
    console.error('Error connecting to Temporal:', error);
    throw error;
  }
}
export function getTemporalClient(): Client {
  if (!client) {
    throw new Error('Temporal client not connected');
  }
  return client;
}
export async function disconnectTemporal(): Promise<void> {
  if (connection) {
    await connection.close();
    console.log('Temporal connection closed.');
  }
}
