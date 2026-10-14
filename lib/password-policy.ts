// Password rules shared by registration and password reset (client and server).

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 16;

export const PASSWORD_RULES = [
  {
    id: "length",
    label: `${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters`,
    test: (pw: string) => pw.length >= PASSWORD_MIN_LENGTH && pw.length <= PASSWORD_MAX_LENGTH,
  },
  { id: "lower", label: "A lowercase letter (a–z)", test: (pw: string) => /[a-z]/.test(pw) },
  { id: "upper", label: "An uppercase letter (A–Z)", test: (pw: string) => /[A-Z]/.test(pw) },
  { id: "number", label: "A number (0–9)", test: (pw: string) => /\d/.test(pw) },
  { id: "special", label: "A special character (e.g. ! @ # $ %)", test: (pw: string) => /[^A-Za-z0-9\s]/.test(pw) },
] as const;

export const PASSWORD_REQUIREMENTS_TEXT =
  `Use ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters with uppercase and lowercase letters, a number and a special character.`;

export function isStrongPassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
