import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security middleware
  app.use(helmet());

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global prefix
  const prefix = process.env.API_PREFIX || 'api';
  app.setGlobalPrefix(prefix);

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('FlowBond Venue API')
    .setDescription('QR-based venue ordering system with sponsor-powered drink quests')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('venues', 'Venue operations')
    .addTag('qr', 'QR code resolution')
    .addTag('sponsors', 'Sponsor management')
    .addTag('quests', 'Quest operations')
    .addTag('tasks', 'Task validation')
    .addTag('rewards', 'Reward & DrinkPass management')
    .addTag('notifications', 'Notification system')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(prefix, app, document);

  // Start server
  const port = process.env.API_PORT || 3001;
  await app.listen(port);

  console.log(`🚀 FlowBond API is running on: http://localhost:${port}/${prefix}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/${prefix}`);
}

bootstrap();
