import { GoogleLoginUseCase, GoogleLoginInput } from '../google-login.usecase';
import { TokenGeneratorService } from '../../infra/services/token-generator.service';
import { AuditLogService } from '../../../../../shared/infra/services/audit-log.service';
import { R } from '../../../../../shared/domain/result';

describe('GoogleLoginUseCase', () => {
    let useCase: GoogleLoginUseCase;
    let mockUserRepository: any;
    let mockSessionRepository: any;
    let mockTokenGenerator: jest.Mocked<TokenGeneratorService>;
    let mockAuditLog: jest.Mocked<AuditLogService>;

    beforeEach(() => {
        mockUserRepository = {
            findByGoogleId: jest.fn(),
            findByEmail: jest.fn(),
            save: jest.fn(),
            findById: jest.fn(),
            assignRole: jest.fn(),
            createWithSession: jest.fn(),
        };

        mockSessionRepository = {
            create: jest.fn(),
        };

        mockTokenGenerator = {
            generateTokens: jest.fn(),
        } as any;

        mockAuditLog = {
            logLoginSuccess: jest.fn(),
        } as any;

        useCase = new GoogleLoginUseCase(
            mockUserRepository,
            mockSessionRepository,
            mockTokenGenerator,
            mockAuditLog,
        );
    });

    describe('existing user by googleId', () => {
        it('should return tokens for user found by googleId', async () => {
            // Arrange
            const googleInput: GoogleLoginInput = {
                googleId: 'google-123',
                email: 'user@example.com',
                displayName: 'User Name',
                avatarUrl: 'https://example.com/avatar.jpg',
            };

            const existingUser = {
                id: 'user-456',
                email: 'user@example.com',
                googleId: 'google-123',
            };

            const tokens = {
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                expiresIn: 900,
            };

            const mockSession = {
                id: 'session-123',
                refreshToken: 'refresh-token',
                userId: 'user-456',
                expiresAt: new Date(),
            };

            mockUserRepository.findByGoogleId.mockResolvedValue(R.ok(existingUser));
            mockTokenGenerator.generateTokens.mockReturnValue(tokens);
            mockSessionRepository.create.mockResolvedValue(R.ok(mockSession));

            // Act
            const result = await useCase.execute(googleInput);

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual(tokens);
            }
            expect(mockUserRepository.findByGoogleId).toHaveBeenCalledWith('google-123');
            expect(mockAuditLog.logLoginSuccess).toHaveBeenCalledWith(
                'user-456',
                'unknown',
                'unknown',
            );
        });
    });

    describe('existing user by email', () => {
        it('should update googleId and return tokens', async () => {
            // Arrange
            const googleInput: GoogleLoginInput = {
                googleId: 'google-123',
                email: 'user@example.com',
                displayName: 'User Name',
            };

            const existingUser = {
                id: 'user-789',
                email: 'user@example.com',
                googleId: null,
                provider: 'local',
            };

            const tokens = {
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                expiresIn: 900,
            };

            const mockSession = {
                id: 'session-456',
                refreshToken: 'refresh-token',
                userId: 'user-789',
                expiresAt: new Date(),
            };

            mockUserRepository.findByGoogleId.mockResolvedValue(
                R.error(new Error('Not found')),
            );
            mockUserRepository.findByEmail.mockResolvedValue(R.ok(existingUser));
            mockUserRepository.save.mockResolvedValue(R.ok(undefined));
            mockTokenGenerator.generateTokens.mockReturnValue(tokens);
            mockSessionRepository.create.mockResolvedValue(R.ok(mockSession));

            // Act
            const result = await useCase.execute(googleInput);

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual(tokens);
            }
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('user@example.com');
            expect(mockUserRepository.save).toHaveBeenCalled();
            const savedUser = mockUserRepository.save.mock.calls[0][0];
            expect(savedUser.googleId).toBe('google-123');
            expect(savedUser.provider).toBe('google');
        });
    });

    describe('new user creation', () => {
        it('should create new user with default role and return tokens', async () => {
            // Arrange
            const googleInput: GoogleLoginInput = {
                googleId: 'google-new',
                email: 'newuser@example.com',
                displayName: 'New User',
                avatarUrl: 'https://example.com/avatar.jpg',
            };

            const newUser = {
                id: 'user-new',
                email: 'newuser@example.com',
                googleId: 'google-new',
                provider: 'google',
            };

            const tokens = {
                accessToken: 'access-token-new',
                refreshToken: 'refresh-token-new',
                expiresIn: 900,
            };

            mockUserRepository.findByGoogleId.mockResolvedValue(
                R.error(new Error('Not found')),
            );
            mockUserRepository.findByEmail.mockResolvedValue(
                R.error(new Error('Not found')),
            );
            mockUserRepository.createWithSession.mockResolvedValue(R.ok(newUser));
            mockUserRepository.assignRole.mockResolvedValue(undefined);
            mockUserRepository.findById.mockResolvedValue(R.ok(newUser));
            mockTokenGenerator.generateTokens.mockReturnValue(tokens);
            mockSessionRepository.create.mockResolvedValue(
                R.ok({ id: 'session-new', refreshToken: 'refresh-token-new', userId: 'user-new' }),
            );

            // Act
            const result = await useCase.execute(googleInput);

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual(tokens);
            }
            expect(mockUserRepository.createWithSession).toHaveBeenCalled();
            expect(mockUserRepository.assignRole).toHaveBeenCalledWith(
                expect.any(String),
                3, // USUARIO role
            );
            expect(mockAuditLog.logLoginSuccess).toHaveBeenCalledWith(
                expect.any(String),
                'unknown',
                'unknown',
            );
        });
    });

    describe('error handling', () => {
        it('should return error if createWithSession fails', async () => {
            // Arrange
            const googleInput: GoogleLoginInput = {
                googleId: 'google-fail',
                email: 'fail@example.com',
                displayName: 'Fail User',
            };

            mockUserRepository.findByGoogleId.mockResolvedValue(
                R.error(new Error('Not found')),
            );
            mockUserRepository.findByEmail.mockResolvedValue(
                R.error(new Error('Not found')),
            );
            mockUserRepository.createWithSession.mockResolvedValue(
                R.error(new Error('Database error')),
            );

            // Act
            const result = await useCase.execute(googleInput);

            // Assert
            expect(result.isErr()).toBe(true);
        });

        it('should not fail login if assignRole throws error', async () => {
            // Arrange - Similar to new user creation but assignRole throws
            const googleInput: GoogleLoginInput = {
                googleId: 'google-role-fail',
                email: 'roletest@example.com',
                displayName: 'Role Test User',
            };

            const newUser = {
                id: 'user-role-fail',
                email: 'roletest@example.com',
                googleId: 'google-role-fail',
            };

            const tokens = {
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                expiresIn: 900,
            };

            mockUserRepository.findByGoogleId.mockResolvedValue(
                R.error(new Error('Not found')),
            );
            mockUserRepository.findByEmail.mockResolvedValue(
                R.error(new Error('Not found')),
            );
            mockUserRepository.createWithSession.mockResolvedValue(R.ok(newUser));
            mockUserRepository.assignRole.mockRejectedValue(new Error('Role not found'));
            mockUserRepository.findById.mockResolvedValue(R.ok(newUser));
            mockTokenGenerator.generateTokens.mockReturnValue(tokens);
            mockSessionRepository.create.mockResolvedValue(
                R.ok({ id: 'session-123', refreshToken: 'refresh-token' }),
            );

            // Act
            const result = await useCase.execute(googleInput);

            // Assert - Login should still succeed even if role assignment fails
            expect(result.isOk()).toBe(true);
        });
    });
});
