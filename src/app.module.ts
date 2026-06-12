import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { config } from 'dotenv';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BasicAuthModule } from './modules/basic-auth/basic-auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { SharedModule } from './shared/shared.module';

config();

const typeOrmConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'auth_db',
  autoLoadEntities: true,
  synchronize: false,
  logging: false,
};

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,    // 1 minuto
        limit: 5,      // 5 requisições por minuto
        skipIf: () => process.env.NODE_ENV === 'development',
      },
    ]),
    SharedModule,
    BasicAuthModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
