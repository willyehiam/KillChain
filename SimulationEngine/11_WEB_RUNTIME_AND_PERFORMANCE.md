# Web Runtime and Performance

## Separation

The future architecture should separate:

1. Simulation.
2. Protocol.
3. Content.
4. Persistence.
5. Map rendering.
6. Interface.
7. Server authority.
8. Tooling.

## Main thread

The browser main thread should prioritize:

1. Input.
2. Layout.
3. Map interaction.
4. Animation.
5. Panels.
6. Accessibility.

Heavy simulation and AI should not block interaction.

## Worker or service

Single player simulation may run in a Web Worker or local service.

Persistent and multiplayer campaigns likely require an authoritative server.

## Renderer

The map renderer should handle:

1. Vector geography.
2. Satellite imagery.
3. Symbols.
4. Paths.
5. Coverage.
6. Networks.
7. Areas.
8. Labels.
9. Animation.
10. Clustering.
11. Globe view.

WebGPU is the primary high fidelity renderer. WebGPU compatibility mode and a
reduced WebGL2 path preserve access on unsupported browsers and older hardware.

The renderer must begin with a capability probe and select a declared tier. It
must also recover from device loss without corrupting simulation state.

Renderer tiers may change visual density, but they may not:

1. Change simulation outcomes.
2. Reveal different intelligence.
3. Change interaction timing.
4. Remove required controls.
5. Make save files incompatible.

The authoritative simulation never depends on GPU floating point output.

## Simulation versus animation

The engine advances through deterministic updates. The renderer interpolates
movement and effects.

At higher time speeds, visual animation may compress while preserving meaningful
state changes.

## Data transfer

The interface should receive compact projections and deltas rather than cloning
the complete world state every frame.

Possible techniques to investigate:

1. Incremental patches.
2. Typed arrays.
3. Binary protocols.
4. Shared memory where safe.
5. Spatial queries.
6. Subscription based projections.

## Level of detail

Rendering level of detail and simulation aggregation are related but distinct.

The renderer may hide detail without changing simulation resolution.

## Performance budgets

Future budgets should cover:

1. Simulation ticks per second.
2. Maximum command latency.
3. AI planning time.
4. Map frame rate.
5. Memory.
6. Save size.
7. Replay speed.
8. Network bandwidth.
9. Initial load.
10. Long campaign growth.

## Benchmark worlds

1. Quiet global world.
2. One active crisis.
3. Several simultaneous wars.
4. Dense air and maritime theater.
5. Large ground war.
6. Maximum intelligence tracks.
7. Maximum accelerated time.
8. Long duration campaign.

## Optimization rule

Begin with the most understandable deterministic implementation. Move isolated
hot paths to lower level technology only after profiling proves the need.
