import assert from 'node:assert/strict'
import { X509Certificate } from 'node:crypto'
import test from 'node:test'
import { decodeProtectedHeader, importX509, jwtVerify } from 'jose'
import { buildWalletRequestObject, createWalletSession } from '../src/wallet-rp.ts'
import { createWalletRequestSigner, signWalletRequestObject } from '../src/wallet-request-signing.ts'

const WALLET_REQUEST_AUDIENCE = 'https://self-issued.me/v2'

test('wallet request signer embeds an x5c certificate for verifier.ipid.me', async () => {
  const signer = await createWalletRequestSigner('https://verifier.ipid.me')
  const session = createWalletSession('https://verifier.ipid.me')
  const jwt = await signWalletRequestObject(buildWalletRequestObject(session), signer, WALLET_REQUEST_AUDIENCE)
  const protectedHeader = decodeProtectedHeader(jwt)

  assert.equal(protectedHeader.alg, 'ES256')
  assert.equal(protectedHeader.typ, 'oauth-authz-req+jwt')
  assert.ok(Array.isArray(protectedHeader.x5c))
  assert.equal(protectedHeader.x5c.length, 1)

  const pem = toPemCertificate(protectedHeader.x5c[0] as string)
  const certificate = new X509Certificate(pem)
  assert.match(certificate.subject, /CN=verifier\.ipid\.me/)

  const verified = await jwtVerify(jwt, await importX509(pem, 'ES256'), {
    issuer: 'verifier.ipid.me',
    audience: WALLET_REQUEST_AUDIENCE
  })

  assert.equal(verified.payload.client_id, 'verifier.ipid.me')
  assert.equal(verified.payload.client_id_scheme, 'pre-registered')
  assert.equal(verified.payload.response_mode, 'direct_post')
})

function toPemCertificate(base64Der: string) {
  const wrapped = base64Der.match(/.{1,64}/g)?.join('\n') || base64Der
  return `-----BEGIN CERTIFICATE-----\n${wrapped}\n-----END CERTIFICATE-----\n`
}
