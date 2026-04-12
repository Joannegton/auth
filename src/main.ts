import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
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
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS not allowed for origin: ${origin}`));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
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

    const port = process.env.PORT ?? 5000;
    await app.listen(port);
    console.log(`🚀 Auth service listening on port ${port}`);
}

bootstrap().catch((err) => {
    console.error('❌ Failed to bootstrap app:', err);
    process.exit(1);
});
