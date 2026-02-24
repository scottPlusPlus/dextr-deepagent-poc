import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';

interface ChatRequestDto {
  userId: string;
  threadId?: string;
  message: string;
  agentId?: string;
}

@Controller('api')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('chat')
  async chat(
    @Body() body: ChatRequestDto,
  ): Promise<{ response: string; threadId?: string }> {
    const result = await this.chatService.sendMessage({
      userId: body.userId,
      threadId: body.threadId,
      message: body.message,
      agentId: body.agentId,
    });
    const output: { response: string; threadId?: string } = {
      response: result.response,
    };
    if (result.threadId) output.threadId = result.threadId;
    return output;
  }

  @Post('chat/stream')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @Header('Transfer-Encoding', 'chunked')
  async streamChat(
    @Body() body: ChatRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    const input = {
      userId: body.userId,
      threadId: body.threadId,
      message: body.message,
      agentId: body.agentId,
    };
    try {
      for await (const item of this.chatService.streamMessage(input)) {
        const payload = JSON.stringify(item);
        res.write(`data: ${payload}\n\n`);
      }
    } catch (err) {
      const errorPayload = JSON.stringify({
        error: err instanceof Error ? err.message : 'Stream error',
      });
      res.write(`data: ${errorPayload}\n\n`);
    } finally {
      res.end();
    }
  }
}
