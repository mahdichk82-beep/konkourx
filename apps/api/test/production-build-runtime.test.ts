import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url))
const apiTsconfig = fileURLToPath(new URL('../tsconfig.json', import.meta.url))
const tscEntrypoint = fileURLToPath(
  new URL('../../../node_modules/typescript/bin/tsc', import.meta.url),
)

const findJavaScriptFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) return findJavaScriptFiles(entryPath)
      return entry.isFile() && entry.name.endsWith('.js') ? [entryPath] : []
    }),
  )
  return files.flat()
}

test('production compilation emits Node-runnable relative import extensions', async () => {
  const outputDirectory = await mkdtemp(path.join(tmpdir(), 'konkourx-api-build-'))

  try {
    await execFileAsync(
      process.execPath,
      [tscEntrypoint, '--project', apiTsconfig, '--outDir', outputDirectory],
      { cwd: repoRoot, maxBuffer: 10 * 1024 * 1024 },
    )

    const emittedFiles = await findJavaScriptFiles(outputDirectory)
    const emittedSources = await Promise.all(emittedFiles.map((file) => readFile(file, 'utf8')))
    const TypeScriptImport = /(?:from\s+|import\s*)["'][.]{1,2}\/[^"']+\.(?:ts|tsx|mts|cts)["']/

    assert.ok(emittedFiles.length > 0, 'expected the API compiler to emit JavaScript files')
    assert.equal(
      emittedSources.some((source) => TypeScriptImport.test(source)),
      false,
      'production JavaScript must not retain relative TypeScript import extensions',
    )
  } finally {
    await rm(outputDirectory, { recursive: true, force: true })
  }
})
