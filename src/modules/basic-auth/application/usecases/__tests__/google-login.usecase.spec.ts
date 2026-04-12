import { GoogleLoginUseCase, GoogleLoginInput } from '../google-login.usecase';
import { AuditLogService } from '../../../../../shared/infra/services/audit-log.service';
import { R } from '../../../../../shared/domain/result';
import type { RequestInfo } from '../../domain/decorators/extract-request-info.decorator';
import { User } from '../../domain/user';

describe('GoogleLoginUseCase', () => {
    let useCase: GoogleLoginUseCase;
    let mockUserRepository: any;
    let mockRoleRepository: any;
    let mockTokenGenerator: any;
    let mockAuditLog: any;
    let requestInfo: RequestInfo;

    beforeEach(() => {
        mockUserRepository = {
            findByGoogleId: jest.fn(),
            findByEmail: jest.fn(),
            save: jest.fn(),
        };

        mockRoleRepository = {
            find: jest.fn(),
        };

        mockTokenGenerator = {
            generateTokens: jest.fn(),
            getRefreshTokenExpiryDays: jest.fn().mockReturnValue(7),
        };

        mockAuditLog = {
            logLoginSuccess: jest.fn(),
        };

        requestInfo = {
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
        };

        useCase = new GoogleLoginUseCase(
            mockUserRepository,
            mockRoleRepository,
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
                toString: () => 'user-456',
                addSession: jest.fn().mockReturnValue(R.ok({})),
            };

            const tokens = {
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                expiresIn: 900,
            };

            mockUserRepository.findByGoogleId.mockResolvedValue(R.ok(existingUser));
            mockTokenGenerator.generateTokens.mockReturnValue(tokens);
            mockUserRepository.save.mockResolvedValue(R.ok(existingUser));

            // Act
            const result = await useCase.execute(googleInput, requestInfo);

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual(tokens);
            }
            expect(mockUserRepository.findByGoogleId).toHaveBeenCalledWith('google-123');
            expect(mockAuditLog.logLoginSuccess).toHaveBeenCalledWith(
                'user-456',
                '192.168.1.1',
                'Mozilla/5.0',
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
                toString: () => 'user-789',
                addGoogleInfo: jest.fn(),
                addSession: jest.fn().mockReturnValue(R.ok({})),
            };

            const tokens = {
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                expiresIn: 900,
            };

            mockUserRepository.findByGoogleId.mockResolvedValue(
                R.error(new Error('Not found')),
            );
            mockUserRepository.findByEmail.mockResolvedValue(R.ok(existingUser));
            mockUserRepository.save.mockResolvedValue(R.ok(existingUser));
            mockTokenGenerator.generateTokens.mockReturnValue(tokens);

            // Act
            const result = await useCase.execute(googleInput, requestInfo);

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual(tokens);
            }
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('user@example.com');
            expect(existingUser.addGoogleInfo).toHaveBeenCalledWith('google-123', undefined);
            expect(mockUserRepository.save).toHaveBeenCalled();
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

            const mockRole = {
                id: 'role-user',
                name: 'USER',
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
            mockRoleRepository.find.mockResolvedValue(R.ok(mockRole));
            mockTokenGenerator.generateTokens.mockReturnValue(tokens);

            // We need to mock User.create to return a user instance
            // For simplicity, we'll assume the save call will be made with a user instance
            mockUserRepository.save.mockImplementation((user) => {
                return Promise.resolve(R.ok(user));
            });

            // Act
            const result = await useCase.execute(googleInput, requestInfo);

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual(tokens);
            }
            expect(mockRoleRepository.find).toHaveBeenCalled();
            expect(mockAuditLog.logLoginSuccess).toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        it('should return error if role find fails', async () => {
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
            mockRoleRepository.find.mockResolvedValue(
                R.error(new Error('Role not found')),
            );

            // Act
            const result = await useCase.execute(googleInput, requestInfo);

            // Assert
            expect(result.isErr()).toBe(true);
        });

        it('should return error if save fails', async () => {
            // Arrange
            const googleInput: GoogleLoginInput = {
                googleId: 'google-save-fail',
                email: 'savefail@example.com',
                displayName: 'Save Fail User',
            };

            const existingUser = {
                id: 'user-save-fail',
                email: 'savefail@example.com',
                googleId: null,
                addGoogleInfo: jest.fn(),
            };

            mockUserRepository.findByGoogleId.mockResolvedValue(
                R.error(new Error('Not found')),
            );
            mockUserRepository.findByEmail.mockResolvedValue(R.ok(existingUser));
            mockUserRepository.save.mockResolvedValue(
                R.error(new Error('Database error')),
            );

            // Act
            const result = await useCase.execute(googleInput, requestInfo);

            // Assert
            expect(result.isErr()).toBe(true);
        });
    });
});
