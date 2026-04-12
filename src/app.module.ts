import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BasicAuthModule } from './modules/basic-auth/basic-auth.module';
import { configService } from './shared/config/database.config';
import { AuditLogService } from './shared/infra/services/audit-log.service';
import { SessionFingerprintService } from './shared/infra/services/session-fingerprint.service';

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
    BasicAuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, AuditLogService, SessionFingerprintService],
  exports: [AuditLogService, SessionFingerprintService],
})
export class AppModule {}
