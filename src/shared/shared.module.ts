import { Module } from '@nestjs/common';
import { AuditLogService } from './infra/services/audit-log.service';
import { SessionFingerprintService } from './infra/services/session-fingerprint.service';

@Module({
    providers: [AuditLogService, SessionFingerprintService],
    exports: [AuditLogService, SessionFingerprintService],
})
export class SharedModule {}
