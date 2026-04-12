import { LoginUseCase } from '../login.usecase';
import { TokenGeneratorService } from '../../infra/services/token-generator.service';
import { AuditLogService } from '../../../../../shared/infra/services/audit-log.service';
import { R } from '../../../../../shared/domain/result';
import type { IPasswordEncryptionService } from '../../domain/services/password-encryption.service';

describe('LoginUseCase', () => {
    let useCase: LoginUseCase;
    let mockUserRepository: any;
    let mockSessionRepository: any;
    let mockTokenGenerator: jest.Mocked<TokenGeneratorService>;
    let mockAuditLog: jest.Mocked<AuditLogService>;
    let mockPasswordEncryption: jest.Mocked<IPasswordEncryptionService>;

    beforeEach(() => {
        mockUserRepository = {
            findByEmail: jest.fn(),
        };

        mockSessionRepository = {
            create: jest.fn(),
        };

        mockTokenGenerator = {
            generateTokens: jest.fn(),
        } as any;

        mockAuditLog = {
            logLoginSuccess: jest.fn(),
            logLoginFailure: jest.fn(),
        } as any;

        mockPasswordEncryption = {
            hashPassword: jest.fn(),
            comparePassword: jest.fn(),
        } as any;

        useCase = new LoginUseCase(
            mockUserRepository,
            mockSessionRepository,
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
            };

            const tokens = {
                accessToken: 'access-token-123',
                refreshToken: 'refresh-token-123',
                expiresIn: 900,
            };

            const mockSession = {
                id: 'session-123',
                refreshToken: 'refresh-token-123',
                userId: 'user-123',
                expiresAt: new Date(),
            };

            mockUserRepository.findByEmail.mockResolvedValue(R.ok(user));
            mockPasswordEncryption.comparePassword.mockResolvedValue(true);
            mockTokenGenerator.generateTokens.mockReturnValue(tokens);
            mockSessionRepository.create.mockResolvedValue(R.ok(mockSession));

            // Act
            const result = await useCase.execute(
                { email: 'test@example.com', password: 'correctPassword123' },
            );

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual(tokens);
            }
            expect(mockSessionRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    refreshToken: 'refresh-token-123',
                    userId: 'user-123',
                }),
            );
            expect(mockAuditLog.logLoginSuccess).toHaveBeenCalledWith(
                'user-123',
                'unknown',
                'unknown',
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
            };

            mockUserRepository.findByEmail.mockResolvedValue(R.ok(user));
            mockPasswordEncryption.comparePassword.mockResolvedValue(false);

            // Act
            const result = await useCase.execute(
                { email: 'test@example.com', password: 'wrongPassword' },
            );

            // Assert
            expect(result.isErr()).toBe(true);
            expect(mockAuditLog.logLoginFailure).toHaveBeenCalledWith(
                'test@example.com',
                'unknown',
                'unknown',
                'Invalid password',
            );
            expect(mockAuditLog.logLoginSuccess).not.toHaveBeenCalled();
        });

        it('should log failure on user not found', async () => {
            // Arrange
            mockUserRepository.findByEmail.mockResolvedValue(
                R.error(new Error('User not found')),
            );

            // Act
            const result = await useCase.execute(
                { email: 'nonexistent@example.com', password: 'password' },
            );

            // Assert
            expect(result.isErr()).toBe(true);
            expect(mockAuditLog.logLoginFailure).toHaveBeenCalledWith(
                'nonexistent@example.com',
                'unknown',
                'unknown',
                'User not found',
            );
        });

        it('should log failure if user has no password', async () => {
            // Arrange
            const user = {
                id: 'user-456',
                email: 'social@example.com',
                password: null,  // Usuário registrado via Google
            };

            mockUserRepository.findByEmail.mockResolvedValue(R.ok(user));

            // Act
            const result = await useCase.execute(
                { email: 'social@example.com', password: 'anything' },
            );

            // Assert
            expect(result.isErr()).toBe(true);
            expect(mockAuditLog.logLoginFailure).toHaveBeenCalledWith(
                'social@example.com',
                'unknown',
                'unknown',
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
            };

            const mockSession = {
                id: 'session-123',
                refreshToken: 'refresh',
                userId: 'user-123',
                expiresAt: new Date(),
            };

            mockUserRepository.findByEmail.mockResolvedValue(R.ok(user));
            mockPasswordEncryption.comparePassword.mockResolvedValue(true);
            mockTokenGenerator.generateTokens.mockReturnValue({
                accessToken: 'token',
                refreshToken: 'refresh',
                expiresIn: 900,
            } as any);
            mockSessionRepository.create.mockResolvedValue(R.ok(mockSession));

            // Act
            await useCase.execute(
                { email: '  TEST@EXAMPLE.COM  ', password: 'password123' },
            );

            // Assert
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
                'test@example.com',
            );
        });
    });
});
