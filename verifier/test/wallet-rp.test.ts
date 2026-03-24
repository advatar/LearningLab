import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildWalletRequestObject,
  createWalletSession,
  extractPresentedCredentials,
  normalizeWalletDirectPostBody
} from '../src/wallet-rp.ts'

test('createWalletSession builds a preregistered deep link for the public verifier', () => {
  const session = createWalletSession('https://verifier.ipid.me', Date.UTC(2026, 2, 23, 12, 0, 0))

  assert.equal(session.clientId, 'verifier.ipid.me')
  assert.equal(session.legalName, 'iProov Verifier')
  assert.match(session.requestUri, /^https:\/\/verifier\.ipid\.me\/wallet\/request\.jwt\//)
  assert.match(session.responseUri, /^https:\/\/verifier\.ipid\.me\/wallet\/direct_post\//)
  assert.match(session.resultUri, /^https:\/\/verifier\.ipid\.me\/wallet\/session\//)
  assert.match(
    session.deepLink,
    /^eudi-openid4vp:\/\/verifier\.ipid\.me\?client_id=verifier\.ipid\.me&request_uri=https%3A%2F%2Fverifier\.ipid\.me%2Fwallet%2Frequest\.jwt%2F/
  )
})

test('buildWalletRequestObject asks for over-21 plus nationality with a fallback credential', () => {
  const session = createWalletSession('https://verifier.ipid.me')
  const request = buildWalletRequestObject(session)

  assert.equal(request.client_id, 'verifier.ipid.me')
  assert.equal(request.response_uri, session.responseUri)
  assert.equal(request.response_type, 'vp_token')
  assert.equal(request.response_mode, 'direct_post')
  assert.equal(request.nonce, session.nonce)
  assert.equal(request.state, session.state)
  assert.equal(request.dcql_query.credentials.length, 2)

  const primary = request.dcql_query.credentials.find((credential) => credential.id === 'pid-over-21-and-nationality')
  assert.ok(primary)
  assert.deepEqual(primary.meta.vct_values, ['urn:eudi:pid:1'])
  assert.deepEqual(primary.claims, [
    { id: 'age_over_21', path: ['age_over_21'] },
    { id: 'nationality', path: ['nationality'] }
  ])

  const fallback = request.dcql_query.credentials.find((credential) => credential.id === 'learninglab-age-fallback')
  assert.ok(fallback)
  assert.deepEqual(fallback.meta.vct_values, ['https://example.org/vct/age-credential'])
  assert.deepEqual(fallback.claims, [
    { id: 'age_over', path: ['age_over'] },
    { id: 'residency', path: ['residency'] }
  ])

  assert.deepEqual(request.client_metadata.vp_formats_supported['dc+sd-jwt'], {
    'sd-jwt_alg_values': ['ES256'],
    'kb-jwt_alg_values': ['ES256']
  })
})

test('normalizeWalletDirectPostBody parses JSON strings and extractPresentedCredentials flattens tokens', () => {
  const normalized = normalizeWalletDirectPostBody({
    vp_token: '["credential-one","credential-two"]',
    presentation_submission: '{"id":"submission-1"}',
    state: 'session-state'
  })

  assert.deepEqual(normalized.presentation_submission, { id: 'submission-1' })
  assert.deepEqual(extractPresentedCredentials(normalized.vp_token), ['credential-one', 'credential-two'])
  assert.deepEqual(
    extractPresentedCredentials([{ credential: 'credential-three' }, { sd_jwt: 'credential-four' }]),
    ['credential-three', 'credential-four']
  )
})
