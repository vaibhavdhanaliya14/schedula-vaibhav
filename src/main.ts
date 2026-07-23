import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ⚠️ Enable global validation to handle edge cases automatically
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strips out any extra properties not defined in the DTO
    forbidNonWhitelisted: true, // Throws an error if extra properties are sent
  }));

  await app.listen(3000);
}
bootstrap();
