import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';

config();

class ConfigService {
    getTypeOrmConfig(): TypeOrmModuleOptions {
        return {
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_NAME || 'auth_db',
            entities: ['dist/modules/**/infra/models/*.model.js'],
            migrations: ['dist/shared/infra/migrations/*.js'],
            // subscribers: ['dist/shared/infra/subscribers/*.js'],
            synchronize: false,
            logging: process.env.NODE_ENV === 'development',
        };
    }
}

export const configService = new ConfigService();
