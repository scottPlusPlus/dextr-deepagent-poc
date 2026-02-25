import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { ToolsController } from './tools.controller';

@Module({
  controllers: [AgentsController, ToolsController],
  providers: [AgentsService],
})
export class AgentsModule {}
