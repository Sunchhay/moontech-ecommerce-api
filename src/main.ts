import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { setupSwagger } from './common/utils/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefix & versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: 'v1' });

  // Validation / CORS
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: true, credentials: true });

  // Swagger / Filters / Interceptors
  setupSwagger(app);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // ✅ Use Render's assigned port and bind to 0.0.0.0
  const config = app.get(ConfigService);
  const port = Number(process.env.PORT ?? config.get('PORT') ?? 3000);

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server ready on http://0.0.0.0:${port}/api`);
}
bootstrap();
