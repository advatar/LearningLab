// The integrated `main` branch keeps the final runtime behavior, but the
// classroom checker still needs Lab 04 to isolate issuance-time liveness.
// These helpers let `/credential` temporarily restore that lesson behavior
// only when LAB_ID=04.
export type CredentialIssuanceIProovDecision =
  | { allowed: true }
  | { allowed: false; reason: 'requires_liveness' }

export function normalizeLabId(raw: string | null | undefined) {
  const value = String(raw || '').trim()
  return /^\d{2}$/.test(value) ? value : null
}

export function shouldRequireIProovForCredentialIssuance(raw: string | null | undefined) {
  return normalizeLabId(raw) === '04'
}

export function evaluateCredentialIssuanceIProovGate(input: {
  labId?: string | null
  providedSession?: boolean
  passedSession?: boolean | null
}): CredentialIssuanceIProovDecision {
  const providedSession = Boolean(input.providedSession)
  const passedSession = input.passedSession === true

  if (!providedSession) {
    return shouldRequireIProovForCredentialIssuance(input.labId) ? { allowed: false, reason: 'requires_liveness' } : { allowed: true }
  }

  return passedSession ? { allowed: true } : { allowed: false, reason: 'requires_liveness' }
}
