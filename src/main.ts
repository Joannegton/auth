import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/infra/filters/exception.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", 'data:', 'https:'],
                },
            },
            hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
            noSniff: true,
            xssFilter: true,
            frameguard: { action: 'deny' },
        }),
    );

    const allowedOrigins = (
        process.env.ALLOWED_ORIGINS || 'http://localhost:3000'
    ).split(',');
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'test') {
                callback(null, true);
            } else {
                callback(new Error(`CORS not allowed for origin: ${origin}`));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['Content-Type'],
        maxAge: 3600,
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    app.useGlobalFilters(new GlobalExceptionFilter());

    if (process.env.ENABLE_DOCS === 'true') {
        const config = new DocumentBuilder()
            .setTitle('Auth Service')
            .setDescription(
                'API de autenticação — registro, login, refresh token e gestão de serviços. ' +
                'Use POST /auth/login com as credenciais de demo para obter um JWT e testar os endpoints protegidos.',
            )
            .setVersion('1.0')
            .addBearerAuth()
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('docs', app, document, {
            swaggerOptions: { persistAuthorization: true },
        });
        console.log('📖 Swagger disponível em /docs');
    }

    const port = process.env.PORT ?? 5000;
    await app.listen(port);
    console.log(`🚀 Auth service listening on port ${port}`);
}

bootstrap().catch((err) => {
    console.error('❌ Failed to bootstrap app:', err);
    process.exit(1);
});
