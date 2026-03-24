import test from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const scriptUrl = pathToFileURL(path.join(__dirname, '..', 'scripts', 'run-demo-conductor.js')).href
const mod = await import(scriptUrl)
const api = mod.default ?? mod

test('parseArgs defaults to host mode with install and build enabled', () => {
  assert.deepEqual(api.parseArgs([]), {
    docker: false,
    install: true,
    build: true,
    help: false
  })
})

test('parseArgs accepts docker mode and skip flags', () => {
  assert.deepEqual(api.parseArgs(['--docker', '--no-install', '--no-build']), {
    docker: true,
    install: false,
    build: false,
    help: false
  })
})

test('shouldInstallDependencies returns true when node_modules is missing', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-up-no-modules-'))
  assert.equal(api.shouldInstallDependencies(tmpRoot), true)
})

test('shouldInstallDependencies returns false when node_modules exists', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-up-with-modules-'))
  fs.mkdirSync(path.join(tmpRoot, 'node_modules'))
  assert.equal(api.shouldInstallDependencies(tmpRoot), false)
})
