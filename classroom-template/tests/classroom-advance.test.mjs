import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const scriptUrl = pathToFileURL(path.join(__dirname, '..', 'scripts', 'classroom-advance.js')).href
const mod = await import(scriptUrl)
const api = mod.default ?? mod

test('parseArgs supports csv, from-lab filtering, readiness gating, apply, and json', () => {
  const args = api.parseArgs([
    '--classroom-csv',
    'accepted_assignments.csv',
    '--from',
    '02',
    '--only-ready',
    '--apply',
    '--json'
  ])

  assert.deepEqual(args, {
    repos: [],
    reposFile: null,
    classroomCsv: 'accepted_assignments.csv',
    from: '02',
    workflow: 'classroom.yml',
    onlyReady: true,
    apply: true,
    json: true,
    help: false
  })
})

test('buildAdvancePlan advances all repos on the current lab by default', () => {
  const progress = [
    {
      repo: 'advatar/student-one',
      currentLabId: '01',
      nextLabId: '02',
      readyToAdvance: true,
      reason: 'Latest run passed on main',
      runUrl: 'https://example.test/1'
    },
    {
      repo: 'advatar/student-two',
      currentLabId: '02',
      nextLabId: '03',
      readyToAdvance: true,
      reason: 'Latest run passed on main',
      runUrl: 'https://example.test/2'
    },
    {
      repo: 'advatar/student-three',
      currentLabId: '02',
      nextLabId: '03',
      readyToAdvance: false,
      reason: 'Latest run concluded failure',
      runUrl: 'https://example.test/3'
    }
  ]

  assert.deepEqual(api.buildAdvancePlan(progress, '02'), [
    {
      repo: 'advatar/student-two',
      fromLabId: '02',
      toLabId: '03',
      runUrl: 'https://example.test/2',
      reason: 'Latest run passed on main'
    },
    {
      repo: 'advatar/student-three',
      fromLabId: '02',
      toLabId: '03',
      runUrl: 'https://example.test/3',
      reason: 'Latest run concluded failure'
    }
  ])
})

test('buildAdvancePlan supports opt-in ready-only filtering', () => {
  const progress = [
    {
      repo: 'advatar/student-one',
      currentLabId: '02',
      nextLabId: '03',
      readyToAdvance: true,
      reason: 'Latest run passed on main',
      runUrl: 'https://example.test/1'
    },
    {
      repo: 'advatar/student-two',
      currentLabId: '02',
      nextLabId: '03',
      readyToAdvance: false,
      reason: 'Latest run concluded failure',
      runUrl: 'https://example.test/2'
    },
    {
      repo: 'advatar/student-three',
      currentLabId: '05',
      nextLabId: '',
      readyToAdvance: false,
      reason: 'Final lab already reached',
      runUrl: 'https://example.test/3'
    }
  ]

  assert.deepEqual(api.buildAdvancePlan(progress, '02', { onlyReady: true }), [
    {
      repo: 'advatar/student-one',
      fromLabId: '02',
      toLabId: '03',
      runUrl: 'https://example.test/1',
      reason: 'Latest run passed on main'
    }
  ])
})

test('formatAdvancePlan emits a tab-separated plan', () => {
  const table = api.formatAdvancePlan([
    {
      repo: 'advatar/student-one',
      fromLabId: '01',
      toLabId: '02',
      reason: 'Latest run passed on main',
      runUrl: 'https://example.test/run'
    }
  ])

  assert.match(table, /^repo\tfrom_lab\tto_lab\treason\trun_url/m)
  assert.match(table, /advatar\/student-one\t01\t02\tLatest run passed on main\thttps:\/\/example\.test\/run/)
})
