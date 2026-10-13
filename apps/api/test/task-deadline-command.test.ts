import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { runDeadlineMissReconciliationCommand } from '../src/task-deadline-misses/command.js'

test('one-shot command logs bounded results and always disconnects', async () => {
  const info: unknown[] = []
  let disconnected = false
  const exitCode = await runDeadlineMissReconciliationCommand({
    disconnect: async () => { disconnected = true },
    error: () => { throw new Error('unexpected error log') },
    info: (value) => { info.push(value) },
    reconcile: async () => ({
      batches: 2,
      candidates: 125,
      inserted: 120,
      skipped: 5,
      stoppedBy: 'EMPTY',
    }),
  })

  assert.equal(exitCode, 0)
  assert.equal(disconnected, true)
  assert.deepEqual(info, [{
    event: 'task_deadline_miss_reconciliation_completed',
    batches: 2,
    candidates: 125,
    inserted: 120,
    skipped: 5,
    stoppedBy: 'EMPTY',
  }])
})

test('one-shot command reports failures, disconnects, and returns a failing exit code', async () => {
  const errors: unknown[] = []
  let disconnected = false
  const exitCode = await runDeadlineMissReconciliationCommand({
    disconnect: async () => { disconnected = true },
    error: (value) => { errors.push(value) },
    info: () => undefined,
    reconcile: async () => { throw Object.assign(new Error('database unavailable'), { code: 'ECONNREFUSED' }) },
  })

  assert.equal(exitCode, 1)
  assert.equal(disconnected, true)
  assert.deepEqual(errors, [{
    event: 'task_deadline_miss_reconciliation_failed',
    errorCode: 'ECONNREFUSED',
    errorName: 'Error',
  }])
})

test('systemd timer invokes the repository one-shot command approximately every five minutes', async () => {
  const [service, timer] = await Promise.all([
    readFile(new URL('../../../infrastructure/systemd/konkourix-deadline-misses.service', import.meta.url), 'utf8'),
    readFile(new URL('../../../infrastructure/systemd/konkourix-deadline-misses.timer', import.meta.url), 'utf8'),
  ])

  assert.match(service, /Type=oneshot/)
  assert.match(service, /node dist\/scripts\/reconcile-task-deadline-misses\.js/)
  assert.match(service, /--env-file \/opt\/konkourix\/config\/production\.env/)
  assert.match(timer, /OnUnitActiveSec=5min/)
  assert.match(timer, /Persistent=true/)
})
