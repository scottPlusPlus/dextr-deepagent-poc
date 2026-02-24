import { Controller, Get, Param } from '@nestjs/common';
import type {
  ConversationEvent,
  ConversationMessage,
} from '../lib/conversation-events-types';
import { LogService } from './log.service';

@Controller('api')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get('log/threads')
  async getThreads(): Promise<{ threadIds: string[] }> {
    const threadIds = await this.logService.getLastThreadIds(10);
    const result = { threadIds };
    return result;
  }

  @Get('log/events/:threadId')
  async getEvents(
    @Param('threadId') threadId: string,
  ): Promise<{ events: ConversationEvent[] }> {
    const events = await this.logService.getEventsByThreadId(threadId);
    const result = { events };
    return result;
  }

  @Get('history/:threadId')
  async getHistory(
    @Param('threadId') threadId: string,
  ): Promise<{ messages: ConversationMessage[] }> {
    const messages = await this.logService.getHistoryByThreadId(threadId);
    const result = { messages };
    return result;
  }
}
