import { RefreshTokenUseCase } from '../refresh-token.usecase';
import { TokenGeneratorService, TokenPayload } from '../../infra/services/token-generator.service';
import { R } from '../../../../../shared/domain/result';

describe('RefreshTokenUseCase', () => {
    let useCase: RefreshTokenUseCase;
    let mockUserRepository: any;
    let mockTokenGenerator: any;
    let mockAuditLog: any;

    beforeEach(() => {
        mockUserRepository = {
            findById: jest.fn(),
        };

        mockTokenGenerator = {
            verifyToken: jest.fn(),
            generateTokens: jest.fn(),
        };

        mockAuditLog = {
            logTokenRefresh: jest.fn(),
        };

        useCase = new RefreshTokenUseCase(
            mockUserRepository,
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
                toString: () => 'user-123',
                validateSession: jest.fn().mockReturnValue(true),
            };

            const newTokens = {
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
                expiresIn: 900,
            };

            mockTokenGenerator.verifyToken.mockReturnValue(R.ok(payload));
            mockUserRepository.findById.mockResolvedValue(R.ok(user));
            mockTokenGenerator.generateTokens.mockReturnValue(newTokens);

            // Act
            const result = await useCase.execute({
                refreshToken: 'valid-refresh-token',
            });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual(newTokens);
            }
            expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
            expect(user.validateSession).toHaveBeenCalledWith('valid-refresh-token');
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
            const error = new Error('Invalid token');
            mockTokenGenerator.verifyToken.mockReturnValue(R.error(error));

            // Act
            const result = await useCase.execute({
                refreshToken: 'invalid-token',
            });

            // Assert
            expect(result.isErr()).toBe(true);
        });

        it('should return error on expired refresh token', async () => {
            // Arrange
            const error = new Error('Token expired');
            mockTokenGenerator.verifyToken.mockReturnValue(R.error(error));

            // Act
            const result = await useCase.execute({
                refreshToken: 'expired-token',
            });

            // Assert
            expect(result.isErr()).toBe(true);
        });

        it('should return error if session is invalid', async () => {
            // Arrange
            const payload: TokenPayload = {
                sub: 'user-123',
                email: 'test@example.com',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 604800,
            };

            const user = {
                id: 'user-123',
                email: 'test@example.com',
                toString: () => 'user-123',
                validateSession: jest.fn().mockReturnValue(false),
            };

            mockTokenGenerator.verifyToken.mockReturnValue(R.ok(payload));
            mockUserRepository.findById.mockResolvedValue(R.ok(user));

            // Act
            const result = await useCase.execute({
                refreshToken: 'valid-jwt-but-invalid-session',
            });

            // Assert
            expect(result.isErr()).toBe(true);
            expect(user.validateSession).toHaveBeenCalledWith(
                'valid-jwt-but-invalid-session',
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

            mockTokenGenerator.verifyToken.mockReturnValue(R.ok(payload));
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
