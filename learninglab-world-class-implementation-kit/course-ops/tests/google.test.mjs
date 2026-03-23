import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCourseWorkPatch, buildStudentSubmissionGradePatch, createGoogleClient } from '../src/lib/google.mjs'

test('buildCourseWorkPatch selects only patchable coursework fields', () => {
  const patch = buildCourseWorkPatch({
    title: 'Lab 01 — SD-JWT Issuance',
    description: 'Updated description',
    state: 'DRAFT',
    dueDate: { year: 2026, month: 9, day: 15 },
    dueTime: { hours: 21, minutes: 59, seconds: 0 },
    maxPoints: 100,
    materials: [{ link: { url: 'https://example.test' } }]
  })

  assert.equal(
    patch.updateMask,
    'title,description,state,dueDate,dueTime,maxPoints'
  )
  assert.deepEqual(patch.body, {
    title: 'Lab 01 — SD-JWT Issuance',
    description: 'Updated description',
    state: 'DRAFT',
    dueDate: { year: 2026, month: 9, day: 15 },
    dueTime: { hours: 21, minutes: 59, seconds: 0 },
    maxPoints: 100
  })
})

test('buildCourseWorkPatch rejects empty payloads', () => {
  assert.throws(() => buildCourseWorkPatch({ materials: [] }), /No coursework fields provided/)
})

test('buildCourseWorkPatch excludes non-patchable workType changes', () => {
  const patch = buildCourseWorkPatch({
    workType: 'ASSIGNMENT',
    state: 'PUBLISHED'
  })

  assert.equal(patch.updateMask, 'state')
  assert.deepEqual(patch.body, {
    state: 'PUBLISHED'
  })
})

test('buildStudentSubmissionGradePatch skips unchanged grades', () => {
  const patch = buildStudentSubmissionGradePatch({
    submission: {
      draftGrade: 100,
      assignedGrade: 100
    },
    draftGrade: 100,
    assignedGrade: 100
  })

  assert.deepEqual(patch, {
    draftGrade: null,
    assignedGrade: null,
    updateMask: [],
    shouldPatch: false
  })
})

test('buildStudentSubmissionGradePatch includes only changed grade fields', () => {
  const patch = buildStudentSubmissionGradePatch({
    submission: {
      draftGrade: 50,
      assignedGrade: null
    },
    draftGrade: 100,
    assignedGrade: null
  })

  assert.deepEqual(patch, {
    draftGrade: 100,
    assignedGrade: null,
    updateMask: ['draftGrade'],
    shouldPatch: true
  })
})

test('createGoogleClient accepts a direct GOOGLE_ACCESS_TOKEN', async () => {
  const originalFetch = global.fetch
  const originalAccessToken = process.env.GOOGLE_ACCESS_TOKEN
  const originalClientId = process.env.GOOGLE_CLIENT_ID
  const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET
  const originalRefreshToken = process.env.GOOGLE_REFRESH_TOKEN

  process.env.GOOGLE_ACCESS_TOKEN = 'test-access-token'
  delete process.env.GOOGLE_CLIENT_ID
  delete process.env.GOOGLE_CLIENT_SECRET
  delete process.env.GOOGLE_REFRESH_TOKEN

  let authorizationHeader = null
  global.fetch = async (_url, init = {}) => {
    authorizationHeader = init.headers?.Authorization || null
    return new Response(JSON.stringify({ courses: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const client = await createGoogleClient()
    const response = await client.request('/v1/courses')

    assert.equal(authorizationHeader, 'Bearer test-access-token')
    assert.deepEqual(response, { courses: [] })
  } finally {
    global.fetch = originalFetch
    if (originalAccessToken === undefined) delete process.env.GOOGLE_ACCESS_TOKEN
    else process.env.GOOGLE_ACCESS_TOKEN = originalAccessToken
    if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID
    else process.env.GOOGLE_CLIENT_ID = originalClientId
    if (originalClientSecret === undefined) delete process.env.GOOGLE_CLIENT_SECRET
    else process.env.GOOGLE_CLIENT_SECRET = originalClientSecret
    if (originalRefreshToken === undefined) delete process.env.GOOGLE_REFRESH_TOKEN
    else process.env.GOOGLE_REFRESH_TOKEN = originalRefreshToken
  }
})
