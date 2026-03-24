#!/usr/bin/env node
/*
 * Launch the Village demo conductor either directly on the host or inside Docker Compose.
 *
 * Host mode:
 * - optionally installs workspace dependencies
 * - prepares local .env files
 * - regenerates the demo status list
 * - builds the workspace
 * - runs the conductor in deployment-like "start" mode
 *
 * Docker mode:
 * - delegates to docker compose
 */

const { existsSync } = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

function printUsage() {
  console.log(`Usage:
  node scripts/run-demo-conductor.js
  node scripts/run-demo-conductor.js --docker

Options:
  --docker         Launch the containerized demo-conductor service via docker compose
  --no-install     Skip \`pnpm install -r\` in host mode
  --no-build       Skip \`pnpm build\` in host mode
  --help           Show this message
`)
}

function parseArgs(argv) {
  const out = {
    docker: false,
    install: true,
    build: true,
    help: false
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--docker') out.docker = true
    else if (arg === '--no-install') out.install = false
    else if (arg === '--no-build') out.build = false
    else if (arg === '--help' || arg === '-h') out.help = true
    else throw new Error(`Unknown argument: ${arg}`)
  }

  return out
}

function shouldInstallDependencies(repoRoot) {
  return !existsSync(path.join(repoRoot, 'node_modules'))
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: options.cwd,
    env: options.env ? { ...process.env, ...options.env } : process.env
  })

  if (result.status !== 0) {
    process.exit(result.status || 1)
  }
}

function main(argv) {
  const args = parseArgs(argv)
  if (args.help) {
    printUsage()
    return
  }

  const repoRoot = path.resolve(__dirname, '..')

  if (args.docker) {
    run('docker', ['compose', 'up', '--build', 'demo-conductor'], { cwd: repoRoot })
    return
  }

  const install = args.install && shouldInstallDependencies(repoRoot)
  if (install) {
    run('pnpm', ['install', '-r'], { cwd: repoRoot })
  }

  run('pnpm', ['env:setup'], { cwd: repoRoot })
  run('pnpm', ['--filter', 'status-list', 'run', 'generate'], { cwd: repoRoot })

  if (args.build) {
    run('pnpm', ['build'], { cwd: repoRoot })
  }

  run('pnpm', ['--filter', 'demo-conductor', 'start'], {
    cwd: repoRoot,
    env: {
      DEMO_CONDUCTOR_SERVICE_MODE: 'start',
      DEMO_CONDUCTOR_PORT: '3210'
    }
  })
}

if (require.main === module) {
  try {
    main(process.argv.slice(2))
  } catch (error) {
    console.error(error.message || String(error))
    process.exit(1)
  }
}

module.exports = {
  parseArgs,
  shouldInstallDependencies,
  main
}
