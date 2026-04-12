import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BasicAuthModule } from './modules/basic-auth/basic-auth.module';
import { SharedModule } from './shared/shared.module';
import { configService } from './shared/config/database.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(configService.getTypeOrmConfig()),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,    // 1 minuto
        limit: 5,      // 5 requisições por minuto
        skipIf: () => process.env.NODE_ENV === 'development',
      },
    ]),
    SharedModule,
    BasicAuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
