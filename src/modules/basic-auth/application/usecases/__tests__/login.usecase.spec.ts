import { LoginUseCase } from '../login.usecase';
import { AuditLogService } from '../../../../../shared/infra/services/audit-log.service';
import { R } from '../../../../../shared/domain/result';
import type { IPasswordEncryptionService } from '../../domain/services/password-encryption.service';
import type { RequestInfo } from '../../domain/decorators/extract-request-info.decorator';

describe('LoginUseCase', () => {
    let useCase: LoginUseCase;
    let mockUserRepository: any;
    let mockTokenGenerator: any;
    let mockAuditLog: any;
    let mockPasswordEncryption: any;
    let requestInfo: RequestInfo;

    beforeEach(() => {
        mockUserRepository = {
            findForLogin: jest.fn(),
            save: jest.fn(),
        };

        mockTokenGenerator = {
            generateTokens: jest.fn(),
            getRefreshTokenExpiryDays: jest.fn().mockReturnValue(7),
        };

        mockAuditLog = {
            logLoginSuccess: jest.fn(),
            logLoginFailure: jest.fn(),
        };

        mockPasswordEncryption = {
            comparePassword: jest.fn(),
        };

        requestInfo = {
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
        };

        useCase = new LoginUseCase(
            mockUserRepository,
            mockTokenGenerator,
            mockAuditLog,
            mockPasswordEncryption,
        );
    });

    describe('successful login', () => {
        it('should return tokens on valid credentials', async () => {
            // Arrange
            const user = {
                id: 'user-123',
                email: 'test@example.com',
                password: 'hashed-password',
                toString: () => 'user-123',
                addSession: jest.fn().mockReturnValue(R.ok({})),
            };

            const tokens = {
                accessToken: 'access-token-123',
                refreshToken: 'refresh-token-123',
                expiresIn: 900,
            };

            mockUserRepository.findForLogin.mockResolvedValue(R.ok(user));
            mockPasswordEncryption.comparePassword.mockResolvedValue(true);
            mockTokenGenerator.generateTokens.mockReturnValue(tokens);
            mockUserRepository.save.mockResolvedValue(R.ok(user));

            // Act
            const result = await useCase.execute(
                { email: 'test@example.com', password: 'correctPassword123' },
                requestInfo,
            );

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual(tokens);
            }
            expect(mockUserRepository.findForLogin).toHaveBeenCalledWith('test@example.com');
            expect(mockPasswordEncryption.comparePassword).toHaveBeenCalledWith(
                'correctPassword123',
                'hashed-password',
            );
            expect(mockTokenGenerator.generateTokens).toHaveBeenCalledWith(
                'user-123',
                'test@example.com',
            );
            expect(user.addSession).toHaveBeenCalledWith(
                expect.objectContaining({
                    refreshToken: 'refresh-token-123',
                }),
            );
            expect(mockAuditLog.logLoginSuccess).toHaveBeenCalledWith(
                'user-123',
                '192.168.1.1',
                'Mozilla/5.0',
            );
            expect(mockAuditLog.logLoginFailure).not.toHaveBeenCalled();
        });
    });

    describe('failed login', () => {
        it('should log failure on invalid password', async () => {
            // Arrange
            const user = {
                id: 'user-123',
                email: 'test@example.com',
                password: 'hashed-password',
                toString: () => 'user-123',
            };

            mockUserRepository.findForLogin.mockResolvedValue(R.ok(user));
            mockPasswordEncryption.comparePassword.mockResolvedValue(false);

            // Act
            const result = await useCase.execute(
                { email: 'test@example.com', password: 'wrongPassword' },
                requestInfo,
            );

            // Assert
            expect(result.isErr()).toBe(true);
            expect(mockAuditLog.logLoginFailure).toHaveBeenCalledWith(
                'test@example.com',
                '192.168.1.1',
                'Mozilla/5.0',
                'Invalid password',
            );
            expect(mockAuditLog.logLoginSuccess).not.toHaveBeenCalled();
        });

        it('should log failure on user not found', async () => {
            // Arrange
            mockUserRepository.findForLogin.mockResolvedValue(
                R.error(new Error('User not found')),
            );

            // Act
            const result = await useCase.execute(
                { email: 'nonexistent@example.com', password: 'password' },
                requestInfo,
            );

            // Assert
            expect(result.isErr()).toBe(true);
            expect(mockAuditLog.logLoginFailure).toHaveBeenCalledWith(
                'nonexistent@example.com',
                '192.168.1.1',
                'Mozilla/5.0',
                'User not found',
            );
        });

        it('should log failure if user has no password', async () => {
            // Arrange
            const user = {
                id: 'user-456',
                email: 'social@example.com',
                password: null,  // Usuário registrado via Google
                toString: () => 'user-456',
            };

            mockUserRepository.findForLogin.mockResolvedValue(R.ok(user));

            // Act
            const result = await useCase.execute(
                { email: 'social@example.com', password: 'anything' },
                requestInfo,
            );

            // Assert
            expect(result.isErr()).toBe(true);
            expect(mockAuditLog.logLoginFailure).toHaveBeenCalledWith(
                'social@example.com',
                '192.168.1.1',
                'Mozilla/5.0',
                'User has no password',
            );
        });
    });

    describe('email normalization', () => {
        it('should convert email to lowercase and trim', async () => {
            // Arrange
            const user = {
                id: 'user-123',
                email: 'test@example.com',
                password: 'hashed-password',
                toString: () => 'user-123',
                addSession: jest.fn().mockReturnValue(R.ok({})),
            };

            mockUserRepository.findForLogin.mockResolvedValue(R.ok(user));
            mockPasswordEncryption.comparePassword.mockResolvedValue(true);
            mockTokenGenerator.generateTokens.mockReturnValue({
                accessToken: 'token',
                refreshToken: 'refresh',
                expiresIn: 900,
            });
            mockUserRepository.save.mockResolvedValue(R.ok(user));

            // Act
            await useCase.execute(
                { email: '  TEST@EXAMPLE.COM  ', password: 'password123' },
                requestInfo,
            );

            // Assert
            expect(mockUserRepository.findForLogin).toHaveBeenCalledWith(
                'test@example.com',
            );
        });
    });
});
