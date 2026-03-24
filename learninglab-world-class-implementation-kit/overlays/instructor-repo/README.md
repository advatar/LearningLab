# Instructor repo overlays

This folder gives you the missing pieces to turn your current monorepo into a proper instructor repo that can generate a student starter repo cleanly.

## Included

- `scripts/build-student-template.mjs` — generate a student-safe starter repo into `dist/student-template`
- `starter-overrides/` — compile-friendly TODO versions of key runtime files
- `status-store/` — a safer status-list allocation scaffold and patch notes

Keep `starter-overrides/` limited to files that should actually ship to students.
Internal notes belong in this README, not inside `starter-overrides/`, because that
directory is copied verbatim into the generated starter repo.

## How to use it

From your instructor repo root:

```bash
node path/to/build-student-template.mjs \
  --source . \
  --out ./dist/student-template
```

Then:

1. inspect `dist/student-template`
2. push it to a dedicated `learninglab-starter` repo
3. mark that repo as a GitHub template
4. point `course-ops` at that template repo

## Why not write into `classroom-template/` directly?

Because generated output should not share a directory with hand-maintained source material. Writing generated output into `dist/student-template/` makes the process repeatable and avoids accidental self-overwrite.

The generator also excludes `learninglab-world-class-implementation-kit/`, `STATUS.md`, and local agent instructions so the student template does not inherit instructor-only control-plane material.
