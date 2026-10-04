import type { FastifyInstance } from 'fastify'
import type { AuthService } from '../auth/auth-service.js'
import { requireRoles } from '../auth/rbac.js'
import { successResponse } from '../contracts/api-response.js'
import type { CurriculumReadStore } from '../curriculum/store.js'
import type { CurriculumTrackId } from '../curriculum/types.js'
import type { DomainService } from '../domain/domain-service.js'
import { ApiError } from '../errors/api-error.js'
import { authenticateRequest } from '../plugins/authentication.js'
import {
  curriculumCatalogEntryParamsSchema,
  curriculumCatalogNodeParamsSchema,
  curriculumBoundCatalogEntryParamsSchema,
  curriculumBoundCatalogNodeParamsSchema,
  counselorCurriculumCatalogEntryParamsSchema,
  counselorCurriculumCatalogNodeParamsSchema,
  counselorCurriculumStudentParamsSchema,
  curriculumNodeParamsSchema,
  curriculumPageQuerySchema,
  curriculumPlacementQuerySchema,
  curriculumSearchQuerySchema,
  curriculumTrackParamsSchema,
  curriculumTrackSearchQuerySchema,
} from '../schemas/curriculum.js'

type CurriculumRouteOptions = {
  auth: AuthService
  curriculum: CurriculumReadStore
  domain?: DomainService
}

const parseInput = <T>(result: { success: boolean; data?: T }): T => {
  if (!result.success || result.data === undefined) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Request validation failed')
  }
  return result.data
}

const parseNodeId = (params: unknown): string =>
  parseInput(curriculumNodeParamsSchema.safeParse(params)).id

export const registerCurriculumRoutes = (
  app: FastifyInstance,
  options: CurriculumRouteOptions,
): void => {
  const curriculumReader = {
    preHandler: [
      authenticateRequest(options.auth),
      requireRoles('STUDENT', 'COUNSELOR', 'ADMIN'),
    ],
  }

  const explicitTrackAdmin = {
    preHandler: [
      authenticateRequest(options.auth),
      requireRoles('ADMIN'),
    ],
  }

  app.get('/curriculum/tracks', explicitTrackAdmin, async (request) =>
    successResponse(options.curriculum.listTracks(), request.context.requestId),
  )

  app.get('/curriculum/tracks/:track/catalog', explicitTrackAdmin, async (request) => {
    const { track } = parseInput(curriculumTrackParamsSchema.safeParse(request.params))
    return successResponse(
      options.curriculum.listTrackCatalog(track),
      request.context.requestId,
    )
  })

  app.get('/curriculum/tracks/:track/catalog/:entryId', explicitTrackAdmin, async (request) => {
    const { track, entryId } = parseInput(
      curriculumCatalogEntryParamsSchema.safeParse(request.params),
    )
    return successResponse(
      options.curriculum.getTrackCatalogEntry(track, entryId),
      request.context.requestId,
    )
  })

  app.get('/curriculum/tracks/:track/catalog/:entryId/roots', explicitTrackAdmin, async (request) => {
    const { track, entryId } = parseInput(
      curriculumCatalogEntryParamsSchema.safeParse(request.params),
    )
    return successResponse(
      options.curriculum.listCatalogRoots(track, entryId),
      request.context.requestId,
    )
  })

  app.get(
    '/curriculum/tracks/:track/catalog/:entryId/nodes/:nodeId',
    explicitTrackAdmin,
    async (request) => {
      const { track, entryId, nodeId } = parseInput(
        curriculumCatalogNodeParamsSchema.safeParse(request.params),
      )
      return successResponse(
        options.curriculum.getCatalogNode(track, entryId, nodeId),
        request.context.requestId,
      )
    },
  )

  app.get(
    '/curriculum/tracks/:track/catalog/:entryId/nodes/:nodeId/children',
    explicitTrackAdmin,
    async (request) => {
      const { track, entryId, nodeId } = parseInput(
        curriculumCatalogNodeParamsSchema.safeParse(request.params),
      )
      return successResponse(
        options.curriculum.listCatalogChildren(
          track,
          entryId,
          nodeId,
          parseInput(curriculumPageQuerySchema.safeParse(request.query)),
        ),
        request.context.requestId,
      )
    },
  )

  app.get('/curriculum/tracks/:track/search', explicitTrackAdmin, async (request) => {
    const { track } = parseInput(curriculumTrackParamsSchema.safeParse(request.params))
    const query = parseInput(curriculumTrackSearchQuerySchema.safeParse(request.query))
    return successResponse(
      options.curriculum.searchTrack({ track, ...query }),
      request.context.requestId,
    )
  })

  app.get('/curriculum/scopes', curriculumReader, async (request) =>
    successResponse(
      {
        ...options.curriculum.artifactIdentity(),
        scopes: options.curriculum.listScopes(),
        gradePlacements: options.curriculum.listGradePlacements(),
      },
      request.context.requestId,
    ),
  )

  app.get('/curriculum/placements', curriculumReader, async (request) =>
    successResponse(
      options.curriculum.listPlacements(
        parseInput(curriculumPlacementQuerySchema.safeParse(request.query)),
      ),
      request.context.requestId,
    ),
  )

  app.get('/curriculum/representations', curriculumReader, async (request) =>
    successResponse(
      options.curriculum.listRepresentations(
        parseInput(curriculumPageQuerySchema.safeParse(request.query)),
      ),
      request.context.requestId,
    ),
  )

  app.get('/curriculum/nodes/:id', curriculumReader, async (request) =>
    successResponse(
      options.curriculum.getNode(parseNodeId(request.params)),
      request.context.requestId,
    ),
  )

  app.get('/curriculum/nodes/:id/children', curriculumReader, async (request) =>
    successResponse(
      options.curriculum.listChildren(
        parseNodeId(request.params),
        parseInput(curriculumPageQuerySchema.safeParse(request.query)),
      ),
      request.context.requestId,
    ),
  )

  app.get('/curriculum/search', curriculumReader, async (request) =>
    successResponse(
      options.curriculum.search(
        parseInput(curriculumSearchQuerySchema.safeParse(request.query)),
      ),
      request.context.requestId,
    ),
  )

  if (!options.domain) return

  const studentCurriculum = {
    preHandler: [
      authenticateRequest(options.auth),
      requireRoles('STUDENT'),
    ],
  }
  const counselorCurriculum = {
    preHandler: [
      authenticateRequest(options.auth),
      requireRoles('COUNSELOR'),
    ],
  }
  const requireTrack = (track: CurriculumTrackId | null): CurriculumTrackId => {
    if (!track) {
      throw new ApiError(409, 'STUDENT_TRACK_NOT_SET', 'Student track is not set')
    }
    return track
  }
  const ownTrack = async (request: Parameters<DomainService['getStudentProfile']>[0]) => {
    const profile = await options.domain!.getStudentProfile(request)
    return requireTrack(profile?.track ?? null)
  }
  const assignedTrack = async (
    request: Parameters<DomainService['getAssignedStudent']>[0],
    studentId: string,
  ) => requireTrack(await options.domain!.getAssignedStudentTrack(request, studentId))

  app.get('/student/curriculum/catalog', studentCurriculum, async (request) =>
    successResponse(
      options.curriculum.listTrackCatalog(await ownTrack(request.user!)),
      request.context.requestId,
    ),
  )

  app.get('/student/curriculum/catalog/:entryId', studentCurriculum, async (request) => {
    const { entryId } = parseInput(
      curriculumBoundCatalogEntryParamsSchema.safeParse(request.params),
    )
    return successResponse(
      options.curriculum.getTrackCatalogEntry(await ownTrack(request.user!), entryId),
      request.context.requestId,
    )
  })

  app.get('/student/curriculum/catalog/:entryId/roots', studentCurriculum, async (request) => {
    const { entryId } = parseInput(
      curriculumBoundCatalogEntryParamsSchema.safeParse(request.params),
    )
    return successResponse(
      options.curriculum.listCatalogRoots(await ownTrack(request.user!), entryId),
      request.context.requestId,
    )
  })

  app.get(
    '/student/curriculum/catalog/:entryId/nodes/:nodeId',
    studentCurriculum,
    async (request) => {
      const { entryId, nodeId } = parseInput(
        curriculumBoundCatalogNodeParamsSchema.safeParse(request.params),
      )
      return successResponse(
        options.curriculum.getCatalogNode(await ownTrack(request.user!), entryId, nodeId),
        request.context.requestId,
      )
    },
  )

  app.get(
    '/student/curriculum/catalog/:entryId/nodes/:nodeId/children',
    studentCurriculum,
    async (request) => {
      const { entryId, nodeId } = parseInput(
        curriculumBoundCatalogNodeParamsSchema.safeParse(request.params),
      )
      return successResponse(
        options.curriculum.listCatalogChildren(
          await ownTrack(request.user!),
          entryId,
          nodeId,
          parseInput(curriculumPageQuerySchema.safeParse(request.query)),
        ),
        request.context.requestId,
      )
    },
  )

  app.get('/student/curriculum/search', studentCurriculum, async (request) => {
    const query = parseInput(curriculumTrackSearchQuerySchema.safeParse(request.query))
    return successResponse(
      options.curriculum.searchTrack({ track: await ownTrack(request.user!), ...query }),
      request.context.requestId,
    )
  })

  app.get(
    '/counselor/students/:studentId/curriculum/catalog',
    counselorCurriculum,
    async (request) => {
      const { studentId } = parseInput(
        counselorCurriculumStudentParamsSchema.safeParse(request.params),
      )
      return successResponse(
        options.curriculum.listTrackCatalog(await assignedTrack(request.user!, studentId)),
        request.context.requestId,
      )
    },
  )

  app.get(
    '/counselor/students/:studentId/curriculum/catalog/:entryId',
    counselorCurriculum,
    async (request) => {
      const { studentId, entryId } = parseInput(
        counselorCurriculumCatalogEntryParamsSchema.safeParse(request.params),
      )
      return successResponse(
        options.curriculum.getTrackCatalogEntry(
          await assignedTrack(request.user!, studentId),
          entryId,
        ),
        request.context.requestId,
      )
    },
  )

  app.get(
    '/counselor/students/:studentId/curriculum/catalog/:entryId/roots',
    counselorCurriculum,
    async (request) => {
      const { studentId, entryId } = parseInput(
        counselorCurriculumCatalogEntryParamsSchema.safeParse(request.params),
      )
      return successResponse(
        options.curriculum.listCatalogRoots(
          await assignedTrack(request.user!, studentId),
          entryId,
        ),
        request.context.requestId,
      )
    },
  )

  app.get(
    '/counselor/students/:studentId/curriculum/catalog/:entryId/nodes/:nodeId',
    counselorCurriculum,
    async (request) => {
      const { studentId, entryId, nodeId } = parseInput(
        counselorCurriculumCatalogNodeParamsSchema.safeParse(request.params),
      )
      return successResponse(
        options.curriculum.getCatalogNode(
          await assignedTrack(request.user!, studentId),
          entryId,
          nodeId,
        ),
        request.context.requestId,
      )
    },
  )

  app.get(
    '/counselor/students/:studentId/curriculum/catalog/:entryId/nodes/:nodeId/children',
    counselorCurriculum,
    async (request) => {
      const { studentId, entryId, nodeId } = parseInput(
        counselorCurriculumCatalogNodeParamsSchema.safeParse(request.params),
      )
      return successResponse(
        options.curriculum.listCatalogChildren(
          await assignedTrack(request.user!, studentId),
          entryId,
          nodeId,
          parseInput(curriculumPageQuerySchema.safeParse(request.query)),
        ),
        request.context.requestId,
      )
    },
  )

  app.get(
    '/counselor/students/:studentId/curriculum/search',
    counselorCurriculum,
    async (request) => {
      const { studentId } = parseInput(
        counselorCurriculumStudentParamsSchema.safeParse(request.params),
      )
      const query = parseInput(curriculumTrackSearchQuerySchema.safeParse(request.query))
      return successResponse(
        options.curriculum.searchTrack({
          track: await assignedTrack(request.user!, studentId),
          ...query,
        }),
        request.context.requestId,
      )
    },
  )
}
