import { PasswordValidatorPolicy } from './Password-validator.policy';
import { UserRoleAssignmentPolicy } from './user-role-assignment.policy';

/**
 * Policies exportadas para o módulo
 * - PasswordValidatorPolicy: valida força de senha
 * - UserRoleAssignmentPolicy: centraliza atribuição e validação de roles
 */
export const Policies = [PasswordValidatorPolicy, UserRoleAssignmentPolicy];
