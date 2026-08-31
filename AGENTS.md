<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Yearbook Development Rules

- **Auto-Commit & Push Policy**: Always stage, commit, and push all modifications to the GitHub remote repository (`thearnabsaha/yearbook`) after completing each task or set of changes.
- **Privacy-First & Offline**: Ensure IndexedDB Dexie client-side caching works seamlessly with MongoDB Atlas background sync.
- **Lossless Compression**: Always run photos through `compressImageLossless` before saving into the database.
- **Ocular Alignment**: Ensure face detection and eye level normalization (50% X, 38% Y) is maintained for timelapse continuity.

