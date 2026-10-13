import { prisma } from '../lib/prisma.js'
import { runDeadlineMissReconciliationCommand } from '../task-deadline-misses/command.js'
import {
  createPrismaDeadlineMissReconciliationStore,
  reconcileDeadlineMisses,
} from '../task-deadline-misses/reconciler.js'

const store = createPrismaDeadlineMissReconciliationStore(prisma)

const exitCode = await runDeadlineMissReconciliationCommand({
  disconnect: () => prisma.$disconnect(),
  error: (value) => console.error(JSON.stringify(value)),
  info: (value) => console.log(JSON.stringify(value)),
  reconcile: () => reconcileDeadlineMisses(store),
})

process.exitCode = exitCode
