export function createUnsignedProofJwt(payload: Record<string, unknown>) {
  const header = { alg: 'none', typ: 'JWT' }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encodedHeader}.${encodedPayload}.`
}

export function isAllowedRelayTarget(rawTarget: string, allowedOrigins: string[]) {
  try {
    const url = new URL(rawTarget)
    if (!['http:', 'https:'].includes(url.protocol)) return false
    return allowedOrigins.includes(url.origin)
  } catch {
    return false
  }
}

export function normalizeGitHubUrl(raw: string | null | undefined) {
  const value = String(raw || '').trim()
  if (!value) return null

  const sshMatch = value.match(/^git@github\.com:([^/]+\/[^/]+?)(?:\.git)?$/i)
  if (sshMatch) return `https://github.com/${sshMatch[1]}`

  const httpsMatch = value.match(/^https?:\/\/github\.com\/([^/]+\/[^/]+?)(?:\.git)?\/?$/i)
  if (httpsMatch) return `https://github.com/${httpsMatch[1]}`

  return null
}

export function resolveRepoUrl(configured: string | null | undefined, remote: string | null | undefined) {
  const configuredValue = String(configured || '').trim()
  if (configuredValue) return configuredValue
  return normalizeGitHubUrl(remote)
}

export async function waitFor<T>(
  check: () => Promise<T | false> | T | false,
  {
    timeoutMs = 15_000,
    intervalMs = 250,
    label = 'condition'
  }: { timeoutMs?: number; intervalMs?: number; label?: string } = {}
) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    const result = await check()
    if (result) return result
    await sleep(intervalMs)
  }
  throw new Error(`Timed out waiting for ${label}`)
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
