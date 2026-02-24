import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { queryHotelAvailability } from '../lib/tools/demo-tools';

export function createQueryHotelAvailabilityTool(agentId: string) {
  return tool(
    async (args: { date: string; party_size: number }) => {
      const result = await queryHotelAvailability(
        agentId,
        args.date,
        args.party_size,
      );
      if (!result.success) {
        return JSON.stringify({ error: result.err });
      }
      return JSON.stringify(result.data);
    },
    {
      name: 'query_hotel_availability',
      description:
        'Query room availability and prices for a single date. Use date format YYYY-MMM-DD ex: "2025 Feb 22"',
      schema: z.object({
        date: z.string().describe('Desired date (flexible date format)'),
        party_size: z.number().int().min(1).describe('Number of guests'),
      }),
    },
  );
}
