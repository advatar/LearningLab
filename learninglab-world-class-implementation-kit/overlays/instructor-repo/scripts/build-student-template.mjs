#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const args = parseArgs(process.argv.slice(2))
const sourceRoot = path.resolve(args.source || process.cwd())
const outRoot = path.resolve(args.out || path.join(sourceRoot, 'dist', 'student-template'))
const overlayRoot = path.resolve(__dirname, '..', 'starter-overrides')

const EXCLUDE_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'coverage',
  '.next',
  '.turbo'
])

const EXCLUDE_ROOT_ITEMS = new Set([
  'AGENTS.md',
  'LAB2-W01-Beyond_Compliance_A_Hands-On_Lab_for_Privacy-First_Digital_Identity.key',
  'classroom-template',
  'COURSE_CLASSROOM.md',
  'LESSON_RUNBOOK.md',
  'learninglab-world-class-implementation-kit',
  'STATUS.md',
  'VILLAGE_DEMO_CONDUCTOR.md',
  'WALLET_FORKS.md',
  'wallet-android',
  'wallet-ios'
])

const EXCLUDE_FILES = new Set([
  '.DS_Store'
])

const SENSITIVE_FILE_PREFIXES = [
  'client_secret_'
]

const STRIP_AFTER_COPY = [
  path.join('scripts', 'classroom-advance.js'),
  path.join('scripts', 'classroom-progress.js'),
  path.join('scripts', 'set-lab-id.js')
]

main().catch((error) => {
  console.error(`[build-student-template] FAILED: ${error?.message || error}`)
  process.exitCode = 1
})

async function main() {
  if (args.clean) {
    await fs.rm(outRoot, { recursive: true, force: true })
  }

  await copyTree(sourceRoot, outRoot, sourceRoot)
  await removeStrippedPaths(outRoot)
  await applyOverlay(overlayRoot, outRoot)
  await writeGeneratedMarker()

  console.log(`[build-student-template] ready at ${outRoot}`)
}

async function copyTree(srcDir, destDir, rootDir) {
  await fs.mkdir(destDir, { recursive: true })
  const entries = await fs.readdir(srcDir, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name)
    const relPath = path.relative(rootDir, srcPath)
    const destPath = path.join(destDir, entry.name)

    if (shouldSkip(relPath, entry)) continue

    if (entry.isDirectory()) {
      await copyTree(srcPath, destPath, rootDir)
      continue
    }

    if (entry.isFile()) {
      await fs.mkdir(path.dirname(destPath), { recursive: true })
      await fs.copyFile(srcPath, destPath)
      const stat = await fs.stat(srcPath)
      await fs.chmod(destPath, stat.mode)
    }
  }
}

function shouldSkip(relPath, entry) {
  const normalized = relPath.split(path.sep).join('/')
  if (!normalized || normalized === '.') return false
  const base = path.basename(normalized)

  if (normalized.startsWith('dist/student-template')) return true
  if (normalized.startsWith('classroom-template')) return true
  if (EXCLUDE_ROOT_ITEMS.has(normalized)) return true
  if (EXCLUDE_DIRS.has(base)) return true
  if (EXCLUDE_FILES.has(base)) return true
  if (SENSITIVE_FILE_PREFIXES.some((prefix) => base.startsWith(prefix))) return true
  if (base === '.env' || base.startsWith('.env.')) return true
  if (base.endsWith('.log')) return true
  if (entry.isSymbolicLink?.()) return true

  return false
}

async function removeStrippedPaths(baseDir) {
  for (const relPath of STRIP_AFTER_COPY) {
    const target = path.join(baseDir, relPath)
    await fs.rm(target, { force: true })
  }
}

async function applyOverlay(srcDir, destDir) {
  await copyTree(srcDir, destDir, srcDir)
}

async function writeGeneratedMarker() {
  const markerPath = path.join(outRoot, 'STUDENT_TEMPLATE_GENERATED.md')
  const lines = [
    '# Student template generated',
    '',
    `Generated from: ${sourceRoot}`,
    `Output: ${outRoot}`,
    '',
    'This directory is generated. Edit the instructor repo + overlay files, then regenerate.',
    ''
  ]
  await fs.writeFile(markerPath, lines.join('\n'), 'utf8')
}

function parseArgs(argv) {
  const out = {
    source: null,
    out: null,
    clean: true
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--source') out.source = argv[++i]
    else if (arg.startsWith('--source=')) out.source = arg.split('=')[1]
    else if (arg === '--out') out.out = argv[++i]
    else if (arg.startsWith('--out=')) out.out = arg.split('=')[1]
    else if (arg === '--no-clean') out.clean = false
    else if (arg === '--clean') out.clean = true
    else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage:
  node build-student-template.mjs --source <instructor-repo> --out <target-dir>

Defaults:
  --source ./
  --out ./dist/student-template
  --clean true
`)
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return out
}
