import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { recentTokenUsage } from '../lib/recent-token-usage';

export const recentTokenUsageTool = tool(
  async (args: { hours: number }) => {
    const result = await recentTokenUsage(args.hours);
    return JSON.stringify(result);
  },
  {
    name: 'recent_token_usage',
    description:
      'Returns token usage per thread for the last N hours. Each thread has name, id, and tokens.',
    schema: z.object({
      hours: z.number().int().min(1).describe('Number of hours to look back'),
    }),
  },
);
