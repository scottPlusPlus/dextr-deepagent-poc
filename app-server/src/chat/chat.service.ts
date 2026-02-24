import { Injectable } from '@nestjs/common';
import {
  sendMessage,
  streamMessage,
  type SendMessageInput,
  type SendMessageOutput,
  type StreamChunk,
} from '../send-message';

@Injectable()
export class ChatService {
  async sendMessage(input: SendMessageInput): Promise<SendMessageOutput> {
    return sendMessage(input);
  }

  async *streamMessage(input: SendMessageInput): AsyncGenerator<StreamChunk> {
    yield* streamMessage(input);
  }
}
