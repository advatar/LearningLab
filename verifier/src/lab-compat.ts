// Lab 02 teaches BBS+ proof derivation in isolation. On the integrated branch,
// BBS verification may also require an iProov session, so the classroom runner
// sets LAB_ID=02 to switch off that extra gate only for the lesson check.
export function normalizeLabId(raw: string | null | undefined) {
  const value = String(raw || '').trim()
  return /^\d{2}$/.test(value) ? value : null
}

export function shouldRequireIProovForBbsVerification(raw: string | null | undefined) {
  return normalizeLabId(raw) !== '02'
}
