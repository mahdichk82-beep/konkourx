import type { CurriculumTargetRecord, TaskCurriculumCoverage } from './types.js'

export const curriculumCoverage = (
  targets: CurriculumTargetRecord[] | undefined,
): TaskCurriculumCoverage => {
  const safeTargets = targets ?? []
  const totalItemCount = safeTargets.reduce((count, target) => count + target.items.length, 0)
  const completedItemCount = safeTargets.reduce(
    (count, target) => count + target.items.filter((item) => item.completedAt !== null).length,
    0,
  )
  return {
    targets: safeTargets,
    completedItemCount,
    totalItemCount,
    remainingItemCount: totalItemCount - completedItemCount,
  }
}

