import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { setupSwagger } from './common/utils/swagger';

async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);

  // 1️⃣ Global prefix & versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: 'v1' });

  // 2️⃣ Validation (strip unknown fields)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 3️⃣ CORS
  app.enableCors({ origin: true, credentials: true });

  // 4️⃣ Swagger
  setupSwagger(app);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const config = app.get(ConfigService);
  const port = config.get('PORT') || 3000;
  await app.listen(port);
  console.log(`🚀 Server ready on http://localhost:${port}/api`);
}
bootstrap();
