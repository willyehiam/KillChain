# Reference Repository Lessons

## Difficulty and AI

### What it is

Difficulty and AI is an Europa Universalis IV mod, not a reusable grand strategy
engine.

### Files inspected

1. `events/build_events.txt`
2. `events/multiple_wars.txt`
3. `common/scripted_effects/scripted_building_effect.txt`
4. `common/defines/02_AI_defines.lua`

### Useful pattern

1. Observe state.
2. Gate impossible or dangerous actions.
3. Generate candidates.
4. Score candidates.
5. Select.
6. Execute.
7. Wait before reevaluation.

### Useful lessons

1. A shared economic controller can work across many countries when the state
   data differs.
2. Dynamic country classifications can drive reusable strategy.
3. Difficulty can change planning behavior.
4. Exposed constants make behavior tunable.

### Limitations to avoid

1. Large nested condition trees.
2. Perfect information.
3. Weak strategic memory.
4. Poor decision explanation.
5. Brittle thresholds.
6. Limited causal planning.

## Hearts of Iron IV repository

### What it is

The inspected repository appears to contain an old installed Hearts of Iron IV
distribution rather than the proprietary Clausewitz engine source.

### Files inspected

1. `history/countries/AFG - Afghanistan.txt`
2. `common/country_tags/00_countries.txt`
3. `common/ai_strategy_plans/USA_historical_strategy_plan.txt`
4. `common/national_focus/generic.txt`
5. `common/on_actions/00_on_actions.txt`

### Useful lessons

1. Countries instantiate a shared common model.
2. Compact history files assemble starting state.
3. Generic progression supports many countries.
4. Authored strategy plans provide national direction.
5. Enable and abort conditions let plans react to divergent history.
6. Event hooks and pulses avoid scanning every system every rendered frame.
7. Constants expose global tuning.
8. Bookmarks assemble historical worlds.

### What it does not reveal

1. Core engine loop.
2. Scheduling implementation.
3. Multithreading.
4. Memory layout.
5. Pathfinding.
6. Battle planner internals.
7. Save format internals.
8. Multiplayer synchronization.
9. Rendering architecture.
10. Performance architecture.

### Legal rule

Study structural patterns. Do not copy proprietary code, text, or assets.

## Combined lesson

Approximately 80 playable countries should come from:

1. One deep universal model.
2. Strategic archetypes.
3. Regional systems.
4. Country data.
5. Bespoke content for the most consequential powers.
6. Adaptive plans operating on belief state.

They should not come from 80 separate engines or 80 unrelated AI scripts.
