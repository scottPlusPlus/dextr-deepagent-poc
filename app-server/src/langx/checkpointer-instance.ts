import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { getDatabaseUrl } from '../config';
import { HybridCheckpointer } from './hybrid-checkpointer';

let checkpointerInstance: HybridCheckpointer | null = null;

export function createCheckpointer(): HybridCheckpointer {
  if (!checkpointerInstance) {
    const connString = getDatabaseUrl();
    const postgres = PostgresSaver.fromConnString(connString);
    checkpointerInstance = new HybridCheckpointer(postgres);
  }
  return checkpointerInstance;
}

export async function setupCheckpointer(): Promise<void> {
  const cp = createCheckpointer();
  await cp.setup();
}

export async function teardownCheckpointer(): Promise<void> {
  if (checkpointerInstance) {
    await checkpointerInstance.end();
    checkpointerInstance = null;
  }
}
