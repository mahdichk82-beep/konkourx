import type { FastifyInstance } from 'fastify'
import type { AuthService } from '../auth/auth-service.js'
import { requireRoles } from '../auth/rbac.js'
import { successResponse } from '../contracts/api-response.js'
import type { CurriculumReadStore } from '../curriculum/store.js'
import { ApiError } from '../errors/api-error.js'
import { authenticateRequest } from '../plugins/authentication.js'
import {
  curriculumCatalogEntryParamsSchema,
  curriculumCatalogNodeParamsSchema,
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

  app.get('/curriculum/tracks', curriculumReader, async (request) =>
    successResponse(options.curriculum.listTracks(), request.context.requestId),
  )

  app.get('/curriculum/tracks/:track/catalog', curriculumReader, async (request) => {
    const { track } = parseInput(curriculumTrackParamsSchema.safeParse(request.params))
    return successResponse(
      options.curriculum.listTrackCatalog(track),
      request.context.requestId,
    )
  })

  app.get('/curriculum/tracks/:track/catalog/:entryId', curriculumReader, async (request) => {
    const { track, entryId } = parseInput(
      curriculumCatalogEntryParamsSchema.safeParse(request.params),
    )
    return successResponse(
      options.curriculum.getTrackCatalogEntry(track, entryId),
      request.context.requestId,
    )
  })

  app.get('/curriculum/tracks/:track/catalog/:entryId/roots', curriculumReader, async (request) => {
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
    curriculumReader,
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
    curriculumReader,
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

  app.get('/curriculum/tracks/:track/search', curriculumReader, async (request) => {
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
}
