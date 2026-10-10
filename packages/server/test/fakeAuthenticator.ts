/**
 * Authenticateur logiciel pour les tests : fait ce que ferait un téléphone,
 * en clair et sans secret — une clé P-256, un compteur, et les deux réponses
 * WebAuthn (création et assertion) telles que le navigateur les sérialise.
 */
import { createHash, createSign, generateKeyPairSync, randomBytes, type KeyObject } from 'node:crypto';
import { isoCBOR } from '@simplewebauthn/server/helpers';

const FLAG_UP = 0x01;
const FLAG_UV = 0x04;
const FLAG_BE = 0x08;
const FLAG_BS = 0x10;
const FLAG_AT = 0x40;

function sha256(data: Buffer | string): Buffer {
  return createHash('sha256').update(data).digest();
}

function b64url(data: Buffer): string {
  return data.toString('base64url');
}

export interface FakeAuthenticatorOptions {
  readonly origin: string;
  readonly rpId: string;
  readonly backedUp?: boolean;
  readonly userVerified?: boolean;
}

export class FakeAuthenticator {
  readonly credentialId: Buffer;
  readonly origin: string;
  readonly rpId: string;
  readonly backedUp: boolean;
  readonly userVerified: boolean;
  counter = 0;
  private readonly privateKey: KeyObject;
  private readonly publicKey: KeyObject;

  constructor(options: FakeAuthenticatorOptions) {
    const pair = generateKeyPairSync('ec', { namedCurve: 'P-256' });
    this.privateKey = pair.privateKey;
    this.publicKey = pair.publicKey;
    this.credentialId = randomBytes(32);
    this.origin = options.origin;
    this.rpId = options.rpId;
    this.backedUp = options.backedUp ?? true;
    this.userVerified = options.userVerified ?? true;
  }

  get id(): string {
    return b64url(this.credentialId);
  }

  private flags(attested: boolean): number {
    let f = FLAG_UP;
    if (this.userVerified) f |= FLAG_UV;
    if (this.backedUp) f |= FLAG_BE | FLAG_BS;
    if (attested) f |= FLAG_AT;
    return f;
  }

  private authData(attested: boolean): Buffer {
    const counter = Buffer.alloc(4);
    counter.writeUInt32BE(this.counter);
    const parts = [sha256(this.rpId), Buffer.from([this.flags(attested)]), counter];
    if (attested) {
      const jwk = this.publicKey.export({ format: 'jwk' }) as { x: string; y: string };
      const cose = new Map<number, unknown>([
        [1, 2], // kty EC2
        [3, -7], // alg ES256
        [-1, 1], // crv P-256
        [-2, Buffer.from(jwk.x, 'base64url')],
        [-3, Buffer.from(jwk.y, 'base64url')],
      ]);
      const idLen = Buffer.alloc(2);
      idLen.writeUInt16BE(this.credentialId.length);
      parts.push(Buffer.alloc(16), idLen, this.credentialId, Buffer.from(isoCBOR.encode(cose as never)));
    }
    return Buffer.concat(parts);
  }

  private clientData(type: 'webauthn.create' | 'webauthn.get', challenge: string): Buffer {
    return Buffer.from(JSON.stringify({ type, challenge, origin: this.origin, crossOrigin: false }));
  }

  /** Réponse à `navigator.credentials.create()`. */
  create(challenge: string) {
    const attestation = new Map<string, unknown>([['fmt', 'none'], ['attStmt', new Map()], ['authData', this.authData(true)]]);
    return {
      id: this.id,
      rawId: this.id,
      type: 'public-key' as const,
      response: {
        clientDataJSON: b64url(this.clientData('webauthn.create', challenge)),
        attestationObject: b64url(Buffer.from(isoCBOR.encode(attestation as never))),
        transports: ['internal', 'hybrid'],
      },
      clientExtensionResults: {},
      authenticatorAttachment: 'platform' as const,
    };
  }

  /** Réponse à `navigator.credentials.get()`. Le compteur avance à chaque appel. */
  get(challenge: string, userHandle?: string) {
    this.counter += 1;
    const authData = this.authData(false);
    const clientDataJSON = this.clientData('webauthn.get', challenge);
    const signer = createSign('SHA256');
    signer.update(Buffer.concat([authData, sha256(clientDataJSON)]));
    const signature = signer.sign(this.privateKey);
    return {
      id: this.id,
      rawId: this.id,
      type: 'public-key' as const,
      response: {
        clientDataJSON: b64url(clientDataJSON),
        authenticatorData: b64url(authData),
        signature: b64url(signature),
        ...(userHandle ? { userHandle } : {}),
      },
      clientExtensionResults: {},
      authenticatorAttachment: 'platform' as const,
    };
  }
}
