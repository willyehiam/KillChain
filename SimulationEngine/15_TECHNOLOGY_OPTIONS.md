# Technology Options

This document records candidates only.

## Current prototype

The prototype currently uses:

1. TypeScript.
2. React.
3. MapLibre.
4. A web based Sites deployment.
5. A deterministic simulation module.

This does not lock the future engine.

## Simulation language

### TypeScript first

Potential advantages:

1. Shared types.
2. Fast iteration.
3. Agent comprehension.
4. Web and server portability.
5. Strong tooling.

Potential concerns:

1. Memory pressure.
2. Garbage collection.
3. Numeric performance.
4. Large state serialization.

### Rust or WebAssembly later

Potential uses:

1. Pathfinding.
2. Network flow.
3. Large combat resolution.
4. Spatial indexing.
5. Serialization.

Adopt only after profiling identifies a stable hot path.

## Map

Candidates include:

1. MapLibre.
2. Mapbox.
3. A globe renderer.
4. Custom WebGL or WebGPU overlays.

Decision criteria:

1. Licensing.
2. Global vector and satellite data.
3. Globe support.
4. Custom layers.
5. Performance.
6. Offline or local development.
7. Cost.
8. Symbol and interaction control.

## Approved renderer direction

WebGPU is the primary high fidelity renderer, not the sole supported renderer.

### Capability tiers

1. Tier A: WebGPU core.
2. Tier B: WebGPU compatibility mode.
3. Tier C: WebGL2 reduced fidelity fallback.
4. Tier D: unsupported hardware messaging and diagnostic guidance.

All playable tiers consume the same renderer independent world projection.
Lower tiers may reduce particles, shadows, animation density, texture resolution,
heatmap resolution, and maximum simultaneously drawn detail. They must not change
authoritative game rules or grant different information.

### Appropriate WebGPU work

1. Instanced unit and track symbols.
2. Paths, trails, coverage volumes, and sensor footprints.
3. Dense map overlays and tiled heatmaps.
4. Globe rendering.
5. Particle and weather visualization.
6. GPU clustering and label candidate preparation.
7. Selected visibility or influence fields.
8. Nonauthoritative analytic previews.

### Work that remains off the GPU

1. Authoritative state transitions.
2. Country AI decisions.
3. Resource accounting.
4. Combat outcomes.
5. Diplomacy and politics.
6. Save and replay truth.

Cross device GPU floating point differences must never make a replay diverge.

### Browser support rationale

As of July 2026, WebGPU is powerful but still not classified as a Baseline web
feature across all widely used browser and platform combinations. Safari 26
ships WebGPU, Chromium has broad support and a compatibility mode, while Firefox
support still varies by operating system. An accessible fallback is therefore a
product requirement rather than premature compatibility work.

References:

1. https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API
2. https://developer.chrome.com/blog/new-in-webgpu-146
3. https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
4. https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Experimental_features

## Simulation location

1. Web Worker for local single player.
2. Authoritative server for persistent and multiplayer games.
3. Shared simulation package across both where practical.

## Persistence

Candidates require later study:

1. Snapshots and event logs.
2. Relational storage.
3. Binary save files.
4. Object storage for large replays.

## Agent orchestration

Candidates include:

1. Structured task queue.
2. Git worktrees.
3. Repository contracts.
4. Automated test gates.
5. Model tracing.
6. Durable workflow engine for very long tasks.

## Selection rule

Do not select technology because it sounds advanced. Select it because it best
satisfies an approved game and simulation contract.
