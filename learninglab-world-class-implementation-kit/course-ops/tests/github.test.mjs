import test from 'node:test'
import assert from 'node:assert/strict'
import { addCollaborator, assertRepositoryReusable, getCollaboratorPermission } from '../src/lib/github.mjs'

test('assertRepositoryReusable accepts a matching repository with expected visibility', () => {
  const repository = assertRepositoryReusable(
    {
      full_name: 'acme/learninglab-lab-01-ada',
      private: true,
      archived: false,
      disabled: false
    },
    {
      owner: 'acme',
      repo: 'learninglab-lab-01-ada',
      expectedVisibility: 'private'
    }
  )

  assert.equal(repository.full_name, 'acme/learninglab-lab-01-ada')
})

test('assertRepositoryReusable rejects archived or visibility-mismatched repositories', () => {
  assert.throws(
    () => assertRepositoryReusable(
      {
        full_name: 'acme/learninglab-lab-01-ada',
        private: false,
        archived: true,
        disabled: false
      },
      {
        owner: 'acme',
        repo: 'learninglab-lab-01-ada',
        expectedVisibility: 'private'
      }
    ),
    /not safe to reuse/
  )
})

test('getCollaboratorPermission returns null for missing collaborators', async () => {
  const client = {
    async request() {
      const error = new Error('not found')
      error.status = 404
      throw error
    }
  }

  const permission = await getCollaboratorPermission(client, {
    owner: 'acme',
    repo: 'learninglab-lab-01-ada',
    username: 'adalovelace'
  })

  assert.equal(permission, null)
})

test('addCollaborator skips the repo owner on self-owned pilot repos', async () => {
  let called = false
  const client = {
    async request() {
      called = true
      return {}
    }
  }

  const result = await addCollaborator(client, {
    owner: 'advatar',
    repo: 'learninglab-pilot-lab-01-issuance-advatar',
    username: 'advatar',
    permission: 'push'
  })

  assert.equal(called, false)
  assert.deepEqual(result, { action: 'skipped_owner' })
})
