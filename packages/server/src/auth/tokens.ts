/**
 * Jetons aléatoires et empreintes.
 *
 * Règle : un jeton n'est jamais stocké. On stocke son empreinte SHA-256, et on
 * compare les empreintes. Si la base fuit, elle ne contient rien d'utilisable.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** Jeton de 256 bits, encodé en base64url (43 caractères, sans padding). */
export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Identifiant opaque pour les lignes de la base. */
export function newId(): string {
  return randomBytes(16).toString('base64url');
}

export function fingerprint(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Comparaison en temps constant de deux empreintes hexadécimales. */
export function sameFingerprint(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
