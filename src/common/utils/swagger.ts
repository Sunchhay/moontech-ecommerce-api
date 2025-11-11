// src/common/utils/swagger.ts
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
    const config = new DocumentBuilder()
        .setTitle('Shop API')
        .setDescription('NestJS + Prisma + Postgres')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();

    const doc = SwaggerModule.createDocument(app, config, {
        deepScanRoutes: true,          // <- this is the key for versioned routes
        ignoreGlobalPrefix: false,     // keep /api in the paths if you set a global prefix
        // include: [AppModule],       // optional: limit modules if you want
    });

    SwaggerModule.setup('docs', app, doc, {
        swaggerOptions: { persistAuthorization: true },
        customSiteTitle: 'Shop API Docs',
    });
}
