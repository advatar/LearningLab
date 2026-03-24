import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const scriptUrl = pathToFileURL(path.join(__dirname, '..', 'scripts', 'lab-check.js')).href
const mod = await import(scriptUrl)
const api = mod.default ?? mod

test('resolvePortFromUrl uses explicit URL ports and falls back on invalid input', () => {
  assert.equal(api.resolvePortFromUrl('http://127.0.0.1:4101', 3001), 4101)
  assert.equal(api.resolvePortFromUrl('https://issuer.example.test', 3001), 443)
  assert.equal(api.resolvePortFromUrl('not-a-url', 3001), 3001)
})

test('buildServiceEnv derives child listener ports from target base URLs', () => {
  const env = api.buildServiceEnv(
    'http://127.0.0.1:4101',
    'http://127.0.0.1:4102',
    { ADMIN_TOKEN: 'lab-admin' }
  )

  assert.equal(env.ISSUER_BASE_URL, 'http://127.0.0.1:4101')
  assert.equal(env.VERIFIER_BASE_URL, 'http://127.0.0.1:4102')
  assert.equal(env.ISSUER_PORT, '4101')
  assert.equal(env.VERIFIER_PORT, '4102')
  assert.equal(env.ADMIN_TOKEN, 'lab-admin')
})

test('buildServiceEnv preserves explicit port overrides from the environment', () => {
  const env = api.buildServiceEnv(
    'http://127.0.0.1:4101',
    'http://127.0.0.1:4102',
    {
      ISSUER_PORT: '5101',
      VERIFIER_PORT: '5102'
    }
  )

  assert.equal(env.ISSUER_PORT, '5101')
  assert.equal(env.VERIFIER_PORT, '5102')
})

test('findRunningTargets reports whichever endpoints the probe marks as live', async () => {
  const running = await api.findRunningTargets(
    'http://127.0.0.1:4101',
    'http://127.0.0.1:4102',
    async (url) => url.includes('4102')
  )

  assert.deepEqual(running, ['http://127.0.0.1:4102'])
})

test('assertStartTargetsAvailable rejects explicit start against already-running services', async () => {
  await assert.rejects(
    () =>
      api.assertStartTargetsAvailable(
        'http://127.0.0.1:4101',
        'http://127.0.0.1:4102',
        async (url) => url.includes('4101')
      ),
    /--start requested but services are already running/
  )
})

test('assertStartTargetsAvailable allows explicit start when targets are clear', async () => {
  await assert.doesNotReject(() =>
    api.assertStartTargetsAvailable(
      'http://127.0.0.1:4101',
      'http://127.0.0.1:4102',
      async () => false
    )
  )
})
