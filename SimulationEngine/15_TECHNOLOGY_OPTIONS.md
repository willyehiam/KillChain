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
