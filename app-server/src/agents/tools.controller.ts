import { Controller, Get } from '@nestjs/common';
import { listToolsMetadata, type ToolMetadata } from '../lib/tool-registry';

@Controller('api/tools')
export class ToolsController {
  @Get()
  list(): ToolMetadata[] {
    return listToolsMetadata();
  }
}
