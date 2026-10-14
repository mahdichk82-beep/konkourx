import { PrismaPg } from '@prisma/adapter-pg'
import { env } from '../config/env.js'
import { PrismaClient } from '../generated/prisma/client.js'

const databaseUrl = new URL(env.DATABASE_URL)
const databaseOptions = databaseUrl.searchParams.getAll('options')
const inheritedOptions = databaseOptions.length > 0
  ? databaseOptions
  : process.env.PGOPTIONS
    ? [process.env.PGOPTIONS]
    : []
const postgresOptions = [
  ...inheritedOptions,
  '-c timezone=UTC',
].join(' ')
databaseUrl.searchParams.delete('options')

const adapter = new PrismaPg({
  connectionString: databaseUrl.toString(),
  options: postgresOptions,
})

export const prisma = new PrismaClient({
  adapter,
})
