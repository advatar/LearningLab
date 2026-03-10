import test from 'node:test'
import assert from 'node:assert/strict'
import { planReadyAdvancement, summarizeAdvancementPlan } from '../src/lib/advancement.mjs'

test('planReadyAdvancement advances only ready repos', () => {
  const plan = planReadyAdvancement([
    {
      repoFullName: 'acme/lab-01-ada',
      currentLabId: '01',
      nextLabId: '02',
      readyToAdvance: true
    },
    {
      repoFullName: 'acme/lab-01-grace',
      currentLabId: '01',
      nextLabId: '02',
      readyToAdvance: false
    }
  ])

  assert.equal(plan[0].action, 'advance')
  assert.equal(plan[0].targetLabId, '02')
  assert.equal(plan[1].action, 'skip')
  assert.match(plan[1].reason, /not ready/)
})

test('planReadyAdvancement honors the current LAB_ID filter', () => {
  const plan = planReadyAdvancement([
    {
      repoFullName: 'acme/lab-01-ada',
      currentLabId: '01',
      nextLabId: '02',
      readyToAdvance: true
    },
    {
      repoFullName: 'acme/lab-02-grace',
      currentLabId: '02',
      nextLabId: '03',
      readyToAdvance: true
    }
  ], { fromLabId: '01' })

  assert.equal(plan[0].action, 'advance')
  assert.equal(plan[1].action, 'skip')
  assert.match(plan[1].reason, /not 01/)
})

test('summarizeAdvancementPlan counts advance vs skip decisions', () => {
  const summary = summarizeAdvancementPlan([
    { action: 'advance' },
    { action: 'skip' },
    { action: 'advance' }
  ])

  assert.deepEqual(summary, {
    total: 3,
    advance: 2,
    skip: 1
  })
})
