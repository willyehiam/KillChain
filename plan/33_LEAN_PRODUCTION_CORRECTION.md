# Lean Production Correction

Status: adopted as the working delivery model on August 10, 2026.

## Why this correction exists

KillWeb has accumulated a strong product constitution, a serious evidence model,
and useful safeguards against invented precision. It has not accumulated playable
proof at the same rate. The process has become too close to a waterfall:

1. Finish brainstorming.
2. Research most of the world.
3. Design every system.
4. Choose the architecture.
5. Build the game.

That sequence minimizes early architectural mistakes but maximizes the risk of
spending months on content that does not create good decisions. A game is not a
database with an interface. Research has value only when it changes a choice,
constraint, consequence, or uncertainty that the player can understand.

## Blunt audit

### What has been intelligent

1. Preserving the first prototype instead of treating it as the final foundation.
2. Freezing a historical bookmark and preventing later facts from leaking into it.
3. Separating world truth from faction belief.
4. Requiring actual force provenance and quantity conservation.
5. Treating alliances as political decision systems rather than automatic bonuses.
6. Designing for delegation, progressive complexity, and deterministic replay.
7. Refusing to model unsupported sensitive detail as exact truth.

### What has been wasteful

1. Treating complete research coverage as a prerequisite for testing the next
   layer of the game.
2. Building large country specific generators where a shared compiler and small
   country data files should exist.
3. Requiring approximately twenty political actors before proving that political
   actors generate fun decisions.
4. Pursuing complete national force ledgers before proving which inventory
   distinctions affect strategy.
5. Creating many planning documents without one small continuously playable
   acceptance scenario that invalidates bad ideas.
6. Measuring records, claims, and validators more readily than player decisions,
   meaningful consequences, time to comprehension, and replay variation.
7. Letting fidelity work expand horizontally across countries before validating
   the reusable abstraction vertically.
8. Keeping research, simulation design, interface design, and implementation too
   sequential when limited reversible probes should inform one another.

## The simplified production system

KillWeb will use one walking skeleton and three expanding content rings.

### Walking skeleton

The walking skeleton is a deterministic saved world that can run, pause, advance,
accept one strategic decision, produce delegated plans, allocate real resources,
resolve consequences, and replay identically. It is deliberately narrow but uses
the same object boundaries intended for the final game.

The first acceptance story is:

> A Chinese exercise around Taiwan persists into a coercive blockade. The United
> States player must build domestic and allied authority, collect enough evidence,
> choose among diplomatic, economic, information, and military responses, allocate
> reachable forces and support, observe adaptation, and live with uncertain results.

This story tests the national, theater, and mission layers without requiring the
entire world to be equally detailed.

### Ring 01: Global pulse

Every country exists, changes over time, trades, aligns, reacts, and consumes
resources through a compact macro state. Most countries initially use public
aggregates and archetype behavior. The global pulse prevents a dead background
world without requiring handcrafted depth everywhere.

Minimum country state:

1. Government and succession class.
2. Population and legitimacy.
3. Economic output and fiscal capacity.
4. Energy and trade exposure.
5. Industrial capability classes.
6. Military capability and readiness classes.
7. Alliances, access, sanctions, and active commitments.
8. Strategic objectives and risk tolerance.
9. Territorial and infrastructure regions.
10. Evidence date, confidence, and abstraction tier.

### Ring 02: Opening crisis powers

The United States, China, Taiwan, Japan, South Korea, and the Philippines receive
the first deep authority, force, access, logistics, and political content. North
Korea, Russia, Australia, India, and selected ASEAN states receive enough depth to
intervene, refuse, exploit, or create a second crisis.

### Ring 03: Theater expansion

Other theaters become deep modules one at a time. Their countries already exist
in the global pulse, so expansion enriches existing state rather than creating a
separate scenario universe.

## Reusable content architecture

Country research must stop producing bespoke mini applications.

The target architecture is:

1. One shared country packet schema.
2. One shared compiler.
3. One shared validator.
4. Small evidence registries by country.
5. Small declarative authority routes by country.
6. Reusable government, alliance, economy, and force archetypes.
7. Country overrides only where a real institution changes gameplay.

South Korea is the first migration test. Its packet should be mostly data and
shared rules, not another copy of Japan's large generator.

## Fidelity budget

Each item of detail must answer at least one question:

1. What player decision changes because this exists?
2. What delegated plan changes because this exists?
3. What constraint or consequence changes because this exists?
4. What uncertainty becomes strategically meaningful because this exists?

If none apply, the detail remains a source note or aggregate. It does not enter
the authoritative world state.

### Political actor rule

Twenty actors remain a depth target for important playable countries, not a
universal blocking requirement. A smaller roster is acceptable when it covers
every current authority, succession, coalition, opposition, and plausible
leadership transition needed by the opening decisions.

### Force ledger rule

Capability classes and conserved pools come first. Named platforms appear when
identity affects availability, range, command, basing, loss, diplomacy, or player
comprehension. Complete serial level inventories are not a prerequisite.

### Infrastructure rule

Represent strategic nodes and regional networks. Do not collect every coordinate
before dependency behavior is proven. A node earns individual representation when
its loss, control, or access changes a real option.

## Parallel discovery without premature architecture

Research remains the active stage. The following reversible proof work may run in
parallel because it reduces research waste without choosing the final engine or
visual system:

1. Data compilers and validators.
2. Headless decision and conservation probes.
3. Deterministic replay fixtures.
4. Interface wireframes using synthetic data.
5. Performance measurements on representative object counts.

These are learning instruments. They do not authorize production engine
construction, final visual design, or an irreversible technical stack.

## Delivery cadence

Every autonomous tranche must produce a coherent outcome, not a pile of activity.

An eight hour tranche should normally contain:

1. One dependency removing tool or reusable contract.
2. One or two content packets using that tool.
3. One adversarial review focused on whether the work creates decisions.
4. Passing corpus and application tests.
5. At least one published main branch checkpoint.
6. A measured change in coverage or playable acceptance stories.

Do not spend an entire tranche adding prose unless the prose removes a specific
implementation ambiguity.

The project does not measure autonomy by keeping a process alive for a fixed wall
clock duration. It prepares a bounded queue large enough for sustained work, then
executes until the queue is complete or an explicit authority, evidence, or
technical blocker is reached. Additional activity that does not improve the
acceptance story is waste.

## New progress measures

Record counts remain diagnostics. The primary measures become:

1. Playable acceptance stories supported.
2. Strategic decisions with complete authority and consequence paths.
3. Countries participating through the global pulse.
4. Countries deep enough for direct play.
5. Theater actions reconciled to national resources.
6. Delegated plans that can be explained and overridden.
7. Deterministic replay fixtures passing.
8. Time required for a new country to adopt the shared contract.
9. Percentage of content expressed as shared data rather than bespoke code.
10. Critical player confusion or impossible state defects remaining.

## Immediate sequence

1. Replace the monolithic research exit gate with a minimum gate for simulation
   design and a later content completeness gate.
2. Extract a shared political authority packet compiler from the Japan pattern.
3. Use South Korea to prove the shared compiler and alliance refusal rules.
4. Use the Philippines to prove the same system handles a different constitution
   and access relationship.
5. Build one Indo Pacific participation matrix connecting those countries.
6. Define the first headless walking skeleton acceptance fixture before adding
   another theater.
7. Continue country and theater research only when it feeds the global pulse or
   the walking skeleton.

## Nonnegotiable quality

Lean does not mean casual. The correction removes duplicated process and detail
without gameplay value. It retains causality, conservation, uncertainty,
provenance, accessibility, deterministic replay, and the requirement that every
effect comes from a real capability with a reachable support chain.
