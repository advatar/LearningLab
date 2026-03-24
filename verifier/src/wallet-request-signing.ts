import { createHash } from 'node:crypto'
import { SignJWT, importPKCS8, type KeyLike } from 'jose'
import selfsigned from 'selfsigned'

const WALLET_REQUEST_ALG = 'ES256'

export type WalletRequestSigner = {
  alg: typeof WALLET_REQUEST_ALG
  privateKey: KeyLike
  kid: string
  x5c: [string, ...string[]]
}

export async function createWalletRequestSigner(baseUrl: string): Promise<WalletRequestSigner> {
  const { hostname } = new URL(baseUrl)
  const certificate = await selfsigned.generate(
    [{ name: 'commonName', value: hostname }],
    {
      keyType: 'ec',
      curve: 'P-256',
      algorithm: 'sha256',
      extensions: [
        { name: 'basicConstraints', cA: false },
        { name: 'keyUsage', digitalSignature: true },
        { name: 'extKeyUsage', clientAuth: true, serverAuth: true },
        {
          name: 'subjectAltName',
          altNames: [buildSubjectAltName(hostname)]
        }
      ]
    }
  )

  const x5cValue = pemCertificateToBase64Der(certificate.cert)
  const thumbprint = createHash('sha256').update(Buffer.from(x5cValue, 'base64')).digest('base64url')

  return {
    alg: WALLET_REQUEST_ALG,
    privateKey: await importPKCS8(certificate.private, WALLET_REQUEST_ALG),
    kid: `wallet-request-${thumbprint.slice(0, 16)}`,
    x5c: [x5cValue]
  }
}

export async function signWalletRequestObject(
  payload: Record<string, unknown>,
  signer: WalletRequestSigner,
  audience: string
) {
  return await new SignJWT(payload)
    .setProtectedHeader({
      alg: signer.alg,
      typ: 'oauth-authz-req+jwt',
      kid: signer.kid,
      x5c: signer.x5c
    })
    .setIssuer(String(payload.client_id || ''))
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(signer.privateKey)
}

function buildSubjectAltName(hostname: string) {
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':')) {
    return { type: 7 as const, ip: hostname }
  }
  return { type: 2 as const, value: hostname }
}

function pemCertificateToBase64Der(pem: string) {
  return pem.replace(/-----BEGIN CERTIFICATE-----/g, '').replace(/-----END CERTIFICATE-----/g, '').replace(/\s+/g, '')
}
