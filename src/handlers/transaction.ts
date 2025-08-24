import { Request, Response, RequestHandler } from 'express';
import { getTemporalClient } from '../temporal/client';

export const getTransactionsHandler: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const workflowId: string | undefined = req.params.workflowId;
  if (!workflowId) {
    return res.status(400).json({ message: 'Workflow ID is required.' });
  }
  try {
    const temporalClient = getTemporalClient();
    const handle = temporalClient.workflow.getHandle(workflowId);
    if (!handle) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }
    const description = await handle.describe();
    const response = {
      status: description.status.name.toLowerCase(),
      message: '',
    };

    if (response.status === 'completed') {
      response.message = (await handle.result()) as string;
    } else if (response.status === 'failed') {
      try {
        await handle.result();
      } catch (workflowError: any) {
        const actualError: string = workflowError.cause.cause.message;
        response.message = actualError;
      }
    } else {
      response.message = 'Transaction is currently in progress.';
    }

    res.status(200).json(response);
  } catch (error) {
    console.error(`Error querying workflow ${req.params.workflowId}:`, error);
    res.status(404).json({ message: 'error in getting transaction' });
  }
};
