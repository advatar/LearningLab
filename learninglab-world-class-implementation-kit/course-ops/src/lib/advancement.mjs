export function planReadyAdvancement(progressRows, { fromLabId = null } = {}) {
  return (progressRows || []).map((row) => {
    if (!row.readyToAdvance) {
      return {
        ...row,
        action: 'skip',
        reason: 'Repository is not ready to advance'
      }
    }

    if (!row.nextLabId) {
      return {
        ...row,
        action: 'skip',
        reason: 'No next lab is available'
      }
    }

    if (fromLabId && row.currentLabId !== String(fromLabId)) {
      return {
        ...row,
        action: 'skip',
        reason: `Repository is on LAB_ID ${row.currentLabId || 'unset'}, not ${fromLabId}`
      }
    }

    return {
      ...row,
      action: 'advance',
      targetLabId: row.nextLabId,
      reason: `Advance from LAB_ID ${row.currentLabId} to ${row.nextLabId}`
    }
  })
}

export function summarizeAdvancementPlan(rows) {
  return (rows || []).reduce((summary, row) => {
    summary.total += 1
    if (row.action === 'advance') summary.advance += 1
    else summary.skip += 1
    return summary
  }, {
    total: 0,
    advance: 0,
    skip: 0
  })
}
