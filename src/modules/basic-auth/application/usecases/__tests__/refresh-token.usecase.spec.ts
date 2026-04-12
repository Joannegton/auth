import { RefreshTokenUseCase } from '../refresh-token.usecase';
import { TokenGeneratorService, TokenPayload } from '../../infra/services/token-generator.service';
import { R } from '../../../../../shared/domain/result';

describe('RefreshTokenUseCase', () => {
    let useCase: RefreshTokenUseCase;
    let mockUserRepository: any;
    let mockSessionRepository: any;
    let mockTokenGenerator: jest.Mocked<TokenGeneratorService>;
    let mockAuditLog: any;

    beforeEach(() => {
        mockUserRepository = {
            findById: jest.fn(),
        };

        mockSessionRepository = {
            isValid: jest.fn(),
            create: jest.fn(),
        };

        mockTokenGenerator = {
            verifyToken: jest.fn(),
            generateTokens: jest.fn(),
        } as any;

        mockAuditLog = {
            logTokenRefresh: jest.fn(),
        } as any;

        useCase = new RefreshTokenUseCase(
            mockUserRepository,
            mockSessionRepository,
            mockTokenGenerator,
            mockAuditLog,
        );
    });

    describe('successful refresh', () => {
        it('should return new tokens on valid refresh token', async () => {
            // Arrange
            const payload: TokenPayload = {
                sub: 'user-123',
                email: 'test@example.com',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 604800,  // 7 dias
            };

            const user = {
                id: 'user-123',
                email: 'test@example.com',
            };

            const newTokens = {
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
                expiresIn: 900,
            };

            const newSession = {
                id: 'session-456',
                refreshToken: 'new-refresh-token',
                userId: 'user-123',
                expiresAt: new Date(),
            };

            mockTokenGenerator.verifyToken.mockReturnValue(payload);
            mockSessionRepository.isValid.mockResolvedValue(R.ok(true));
            mockUserRepository.findById.mockResolvedValue(R.ok(user));
            mockTokenGenerator.generateTokens.mockReturnValue(newTokens);
            mockSessionRepository.create.mockResolvedValue(R.ok(newSession));

            // Act
            const result = await useCase.execute({
                refreshToken: 'valid-refresh-token',
            });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual(newTokens);
            }
            expect(mockSessionRepository.isValid).toHaveBeenCalledWith(
                'valid-refresh-token',
            );
            expect(mockSessionRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    refreshToken: 'new-refresh-token',
                    userId: 'user-123',
                }),
            );
            expect(mockTokenGenerator.generateTokens).toHaveBeenCalledWith(
                'user-123',
                'test@example.com',
            );
            expect(mockAuditLog.logTokenRefresh).toHaveBeenCalledWith(
                'user-123',
                'unknown',
                'unknown',
            );
        });
    });

    describe('failed refresh', () => {
        it('should return error on invalid refresh token', async () => {
            // Arrange
            mockTokenGenerator.verifyToken.mockReturnValue(null);

            // Act
            const result = await useCase.execute({
                refreshToken: 'invalid-token',
            });

            // Assert
            expect(result.isErr()).toBe(true);
        });

        it('should return error on expired refresh token', async () => {
            // Arrange
            const payload: TokenPayload = {
                sub: 'user-123',
                email: 'test@example.com',
                iat: Math.floor(Date.now() / 1000) - 604800,
                exp: Math.floor(Date.now() / 1000) - 1,  // Expirado
            };

            mockTokenGenerator.verifyToken.mockReturnValue(null);

            // Act
            const result = await useCase.execute({
                refreshToken: 'expired-token',
            });

            // Assert
            expect(result.isErr()).toBe(true);
        });

        it('should return error if session is revoked in database', async () => {
            // Arrange
            const payload: TokenPayload = {
                sub: 'user-123',
                email: 'test@example.com',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 604800,
            };

            mockTokenGenerator.verifyToken.mockReturnValue(payload);
            mockSessionRepository.isValid.mockResolvedValue(R.ok(false));

            // Act
            const result = await useCase.execute({
                refreshToken: 'valid-jwt-but-revoked',
            });

            // Assert
            expect(result.isErr()).toBe(true);
            expect(mockSessionRepository.isValid).toHaveBeenCalledWith(
                'valid-jwt-but-revoked',
            );
        });

        it('should return error if user does not exist', async () => {
            // Arrange
            const payload: TokenPayload = {
                sub: 'nonexistent-user',
                email: 'nonexistent@example.com',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 604800,
            };

            mockTokenGenerator.verifyToken.mockReturnValue(payload);
            mockSessionRepository.isValid.mockResolvedValue(R.ok(true));
            mockUserRepository.findById.mockResolvedValue(
                R.error(new Error('User not found')),
            );

            // Act
            const result = await useCase.execute({
                refreshToken: 'valid-but-user-deleted',
            });

            // Assert
            expect(result.isErr()).toBe(true);
        });
    });
});
