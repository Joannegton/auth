import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';

config();

class ConfigService {
    getTypeOrmConfig(): TypeOrmModuleOptions {
        const isProduction = process.env.NODE_ENV === 'production';

        return {
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_NAME || 'auth_db',
            entities: isProduction
                ? ['dist/**/*.model.js']
                : ['src/**/*.model.ts'],
            migrations: isProduction
                ? ['dist/**/*.migration.js']
                : ['src/**/*.migration.ts'],
            synchronize: false,
            logging: process.env.NODE_ENV === 'development',
        };
    }
}

export const configService = new ConfigService();
