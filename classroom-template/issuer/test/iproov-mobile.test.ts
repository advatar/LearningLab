import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildIProovMobileLaunchUrl,
  parseIProovMobileCallbackUrl,
  renderIProovMobilePage
} from '../src/iproov-mobile.ts'

test('parseIProovMobileCallbackUrl accepts custom wallet schemes', () => {
  assert.equal(parseIProovMobileCallbackUrl('eudi-wallet://iproov'), 'eudi-wallet://iproov')
})

test('parseIProovMobileCallbackUrl rejects javascript urls', () => {
  assert.throws(() => parseIProovMobileCallbackUrl('javascript:alert(1)'), /unsupported protocol/)
})

test('buildIProovMobileLaunchUrl encodes session and callback url', () => {
  const launchUrl = buildIProovMobileLaunchUrl({
    issuerBaseUrl: 'http://localhost:3001',
    callbackUrl: 'eudi-wallet://iproov',
    session: 'session-123'
  })

  assert.equal(
    launchUrl,
    'http://localhost:3001/iproov/mobile/start?session=session-123&callback_url=eudi-wallet%3A%2F%2Fiproov'
  )
})

test('renderIProovMobilePage includes the demo controls', () => {
  const html = renderIProovMobilePage({
    session: 'session-123',
    callbackUrl: 'eudi-wallet://iproov',
    validateUrl: 'http://localhost:3001/iproov/validate',
    webhookUrl: 'http://localhost:3001/iproov/webhook',
    sdkScriptUrl: 'https://cdn.jsdelivr.net/npm/@iproov/web',
    ceremonyBaseUrl: 'https://eu.rp.secure.iproov.me',
    token: null,
    mode: 'demo'
  })

  assert.match(html, /Pass Demo Liveness/)
  assert.match(html, /Fail Demo Liveness/)
  assert.match(html, /eudi-wallet:\/\/iproov/)
})

test('renderIProovMobilePage includes the real-ceremony config', () => {
  const html = renderIProovMobilePage({
    session: 'session-123',
    callbackUrl: 'eudi-wallet://iproov',
    validateUrl: 'http://localhost:3001/iproov/validate',
    webhookUrl: 'http://localhost:3001/iproov/webhook',
    sdkScriptUrl: 'https://cdn.jsdelivr.net/npm/@iproov/web',
    ceremonyBaseUrl: 'https://eu.rp.secure.iproov.me',
    token: 'real-token',
    mode: 'real'
  })

  assert.match(html, /real-token/)
  assert.match(html, /https:\/\/cdn\.jsdelivr\.net\/npm\/@iproov\/web/)
  assert.match(html, /http:\/\/localhost:3001\/iproov\/validate/)
})
