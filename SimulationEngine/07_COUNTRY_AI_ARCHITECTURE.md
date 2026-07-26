# Country AI Architecture

## Boundary

Country AI submits the same kinds of commands available to players and
institutions. It does not mutate authoritative state.

## Inputs

1. Country belief state.
2. National objectives.
3. Institutional objectives.
4. Available capacity.
5. Existing commitments.
6. Historical strategy plans.
7. Leader and faction incentives.
8. Diplomatic relationships.
9. Strategic memory.
10. Difficulty configuration.

## Planner hierarchy

### Strategic agenda

Defines broad goals and time horizons.

### Institutional proposals

Military, diplomatic, economic, intelligence, domestic, and industrial planners
generate possible actions.

### Candidate filter

Removes actions that are impossible, illegal, unaffordable, inaccessible, or
inconsistent with current authority.

### Utility evaluation

Scores value, cost, risk, time, uncertainty, politics, alliance effects,
escalation, and opportunity cost.

### Limited planning

Consequential decisions may explore several future branches.

### Leadership arbitration

Leadership approves, modifies, delays, combines, or rejects proposals.

### Execution monitor

Tracks whether assumptions, capacity, and objectives remain valid.

## Scheduling

AI should evaluate:

1. On important events.
2. On plan review times.
3. On bounded periodic pulses.

It should not reconsider every national choice every frame.

## Belief discipline

AI uses:

1. Observed enemy forces.
2. Estimated readiness.
3. Intelligence confidence.
4. Diplomatic reporting.
5. Domestic information.
6. Strategic assumptions.

It cannot query hidden truth.

## Adaptation

AI updates:

1. Opponent model.
2. Strategy weights.
3. Risk tolerance.
4. Collection priorities.
5. Force posture.
6. Alliance strategy.
7. Institutional trust.

## Decision trace

Every major decision should record:

1. Considered candidates.
2. Rejected candidates.
3. Scores.
4. Assumptions.
5. Constraints.
6. Selected action.
7. Review trigger.

## Compute budget

Country AI needs explicit per country and global budgets. Background countries
may use lower frequency planning without receiving different fundamental rules.
