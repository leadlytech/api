import * as bcrypt from 'bcrypt';

export async function hashPassword(
  password: string,
  rounds = +(process.env.PASSWORD_ROUNDS || 12),
) {
  return await bcrypt.hash(password, rounds);
}

export async function verifyPassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}
