import { operationalErrorFields } from '../lib/operational-logging.js'
import type { DeadlineMissReconciliationResult } from './reconciler.js'

export type DeadlineMissCommandPorts = {
  disconnect(): Promise<void>
  error(value: unknown): void
  info(value: unknown): void
  reconcile(): Promise<DeadlineMissReconciliationResult>
}

export const runDeadlineMissReconciliationCommand = async (
  ports: DeadlineMissCommandPorts,
): Promise<0 | 1> => {
  let exitCode: 0 | 1 = 0

  try {
    const result = await ports.reconcile()
    ports.info({ event: 'task_deadline_miss_reconciliation_completed', ...result })
  } catch (error) {
    exitCode = 1
    ports.error({
      event: 'task_deadline_miss_reconciliation_failed',
      ...operationalErrorFields(error),
    })
  } finally {
    try {
      await ports.disconnect()
    } catch (error) {
      exitCode = 1
      ports.error({
        event: 'task_deadline_miss_reconciliation_disconnect_failed',
        ...operationalErrorFields(error),
      })
    }
  }

  return exitCode
}
