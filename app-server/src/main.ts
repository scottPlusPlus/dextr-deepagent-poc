import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupCheckpointer } from './langx/checkpointer-instance';

async function bootstrap() {
  await setupCheckpointer();
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
