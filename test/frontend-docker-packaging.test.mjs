import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const repositoryRoot = path.resolve(import.meta.dirname, '..')
const toPosix = (value) => value.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '')

const readRepositoryFile = (relativePath) =>
  readFile(path.join(repositoryRoot, relativePath), 'utf8')

const discoverWorkspacePackages = async () => {
  const workspace = await readRepositoryFile('pnpm-workspace.yaml')
  const patterns = [...workspace.matchAll(/^\s*-\s*["']([^"']+)["']\s*$/gm)]
    .map((match) => match[1])
    .filter((pattern) => pattern.endsWith('/*'))
  const packages = new Map()

  for (const pattern of patterns) {
    const parent = pattern.slice(0, -2)
    const entries = await readdir(path.join(repositoryRoot, parent), { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const packageDirectory = toPosix(path.join(parent, entry.name))
      let manifestSource
      try {
        manifestSource = await readRepositoryFile(`${packageDirectory}/package.json`)
      } catch (error) {
        if (error?.code === 'ENOENT') continue
        throw error
      }
      const manifest = JSON.parse(manifestSource)
      packages.set(manifest.name, { directory: packageDirectory, manifest })
    }
  }

  return packages
}

const recursiveWorkspaceDependencies = (rootPackage, packages) => {
  const result = new Map()
  const pending = [rootPackage]

  while (pending.length > 0) {
    const current = pending.pop()
    if (!current || result.has(current.manifest.name)) continue
    result.set(current.manifest.name, current)

    const dependencyGroups = [
      current.manifest.dependencies,
      current.manifest.devDependencies,
      current.manifest.optionalDependencies,
    ]

    for (const dependencies of dependencyGroups) {
      for (const [name, version] of Object.entries(dependencies ?? {})) {
        if (!String(version).startsWith('workspace:')) continue
        const dependency = packages.get(name)
        assert.ok(dependency, `${current.manifest.name} requires missing workspace package ${name}`)
        pending.push(dependency)
      }
    }
  }

  return [...result.values()]
}

const dockerInstructions = (dockerfile) => dockerfile
  .replace(/\\\r?\n\s*/g, ' ')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))

const copyMappingsBefore = (instructions, stopPattern) => {
  const stopIndex = instructions.findIndex((instruction) => stopPattern.test(instruction))
  assert.notEqual(stopIndex, -1, `Dockerfile is missing ${stopPattern}`)

  return instructions.slice(0, stopIndex).flatMap((instruction) => {
    if (!instruction.startsWith('COPY ') || instruction.startsWith('COPY --from=')) return []
    const tokens = instruction.slice('COPY '.length).split(/\s+/)
    const destination = tokens.at(-1)
    const sources = tokens.slice(0, -1)

    return sources.map((source) => ({
      source: toPosix(source),
      destination: toPosix(
        sources.length > 1 || destination.endsWith('/') || destination === '.'
          ? path.posix.join(destination, path.posix.basename(source))
          : destination,
      ),
    }))
  })
}

const coversPath = (mappings, requiredPath) => mappings.some(({ source, destination }) => {
  if (source !== '.' && requiredPath !== source && !requiredPath.startsWith(`${source}/`)) {
    return false
  }

  const suffix = source === '.' ? requiredPath : requiredPath.slice(source.length).replace(/^\//, '')
  return toPosix(path.posix.join(destination, suffix)) === requiredPath
})

const assertPathsCovered = (mappings, requiredPaths, message) => {
  const missing = requiredPaths.filter((requiredPath) => !coversPath(mappings, requiredPath))
  assert.deepEqual(missing, [], `${message}: ${missing.join(', ')}`)
}

test('frontend Docker build stages cover their real pnpm workspace dependency graphs', async (t) => {
  const [packages, compose, nginx] = await Promise.all([
    discoverWorkspacePackages(),
    readRepositoryFile('docker-compose.yml'),
    readRepositoryFile('infrastructure/docker/spa-nginx.conf'),
  ])

  for (const application of ['student-web', 'counselor-web']) {
    await t.test(application, async () => {
      const packageName = application
      const applicationPackage = packages.get(packageName)
      assert.ok(applicationPackage, `workspace is missing ${packageName}`)

      const dockerfilePath = `apps/${application}/Dockerfile`
      const dockerfile = await readRepositoryFile(dockerfilePath)
      const instructions = dockerInstructions(dockerfile)
      const dependencyGraph = recursiveWorkspaceDependencies(applicationPackage, packages)
      const packageDirectories = dependencyGraph.map(({ directory }) => directory)
      const manifests = packageDirectories.map((directory) => `${directory}/package.json`)

      const installMappings = copyMappingsBefore(
        instructions,
        new RegExp(`^RUN pnpm install .*--filter ${application}\\.\\.\\.$`),
      )
      assertPathsCovered(
        installMappings,
        ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', ...manifests],
        `${application} pre-install layer is missing workspace manifests`,
      )

      const buildMappings = copyMappingsBefore(
        instructions,
        new RegExp(`^RUN pnpm --filter ${application} build$`),
      )
      assertPathsCovered(
        buildMappings,
        ['tsconfig.base.json', ...packageDirectories],
        `${application} build layer is missing workspace sources`,
      )

      const composeService = new RegExp(
        `^  ${application}:\\r?\\n([\\s\\S]*?)(?=^  [a-z][a-z0-9-]*:|^volumes:|^networks:)`,
        'm',
      ).exec(compose)?.[1]
      assert.ok(composeService, `Compose is missing ${application}`)
      assert.match(composeService, /^\s+context:\s+\.\s*$/m)
      assert.match(composeService, new RegExp(`^\\s+dockerfile:\\s+${dockerfilePath.replaceAll('/', '\\/')}\\s*$`, 'm'))

      assert.match(dockerfile, /ARG VITE_API_URL/)
      assert.match(dockerfile, /test -n "\$VITE_API_URL"/)
      assert.match(
        dockerfile,
        new RegExp(`COPY --from=build /workspace/apps/${application}/dist /usr/share/nginx/html`),
      )
      assert.match(dockerfile, /USER nginx/)
    })
  }

  assert.match(nginx, /location = \/health\/live/)
  assert.match(nginx, /try_files \$uri \$uri\/ \/index\.html;/)
})
