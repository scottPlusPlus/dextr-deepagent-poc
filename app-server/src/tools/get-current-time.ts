import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getCurrentTime } from '../lib/tools/demo-tools';

export const getCurrentTimeTool = tool(() => getCurrentTime(), {
  name: 'get_current_time',
  description: 'Returns the current date and time in ISO 8601 format',
  schema: z.object({}),
});
