export type CursorPage<T> = {
  items: T[]
  nextCursor: string | null
}

export type CursorPageLoader<T> = (cursor?: string) => Promise<CursorPage<T>>

export type PlanningRoute =
  | { kind: 'GLOBAL' }
  | { kind: 'STUDENT'; studentId: string }

const studentPlanningPath = /^\/students\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/planning$/i

export const planningRouteForPath = (path: string): PlanningRoute | null => {
  if (path === '/planning') return { kind: 'GLOBAL' }
  const match = path.match(studentPlanningPath)
  return match?.[1] ? { kind: 'STUDENT', studentId: match[1] } : null
}

const loadUniquePages = async <T extends { id: string }>(
  fetchPage: CursorPageLoader<T>,
): Promise<T[]> => {
  const items: T[] = []
  const ids = new Set<string>()
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  do {
    const page = await fetchPage(cursor)
    for (const item of page.items) {
      if (ids.has(item.id)) continue
      ids.add(item.id)
      items.push(item)
    }
    const nextCursor = page.nextCursor ?? undefined
    if (!nextCursor || seenCursors.has(nextCursor)) break
    seenCursors.add(nextCursor)
    cursor = nextCursor
  } while (cursor)

  return items
}

export const loadAllStudents = <T extends { id: string }>(
  fetchPage: CursorPageLoader<T>,
): Promise<T[]> => loadUniquePages(fetchPage)

export const loadPlanningTasks = <T extends { id: string }>(
  fetchPage: CursorPageLoader<T>,
): Promise<T[]> => loadUniquePages(fetchPage)
