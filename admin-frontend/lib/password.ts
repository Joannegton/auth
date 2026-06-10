// Avalia força de senha conforme regra do backend:
// mín. 8 chars, maiúscula, minúscula, número e símbolo.

export interface PasswordChecks {
  length: boolean
  upper: boolean
  lower: boolean
  number: boolean
  symbol: boolean
}

export function checkPassword(pw: string): PasswordChecks {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  }
}

export function isStrongPassword(pw: string): boolean {
  const c = checkPassword(pw)
  return c.length && c.upper && c.lower && c.number && c.symbol
}
