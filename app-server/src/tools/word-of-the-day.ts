import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getWordOfTheDay } from '../lib/tools/demo-tools';

export const wordOfTheDayTool = tool(() => getWordOfTheDay(), {
  name: 'word_of_the_day',
  description: 'Returns the word of the day',
  schema: z.object({}),
});
