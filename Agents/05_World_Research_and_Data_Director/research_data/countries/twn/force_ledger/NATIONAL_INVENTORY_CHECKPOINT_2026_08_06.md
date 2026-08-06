# Taiwan National Force Inventory Checkpoint — 2026-08-06

## Disposition

This packet is a public, countrywide accounting scaffold for the 1 September 2025 bookmark. It is intentionally `collecting`, not independently accepted, and not executable.

It contains:

- 27 public command organizations and 32 typed command relationships;
- 38 equipment or capacity taxonomies;
- 36 national inventory pools;
- one deployment-accounting, maintenance, and conservation record for every pool;
- 26 atomic dated claims and one explicit nested-scope contradiction;
- two planned construction records whose ordered, delivered, and accepted quantities remain unknown.

## Evidence and accounting rule

The 2024 United States Department of Defense report supplies dated operational estimates for personnel, formations, major naval categories, Coast Guard ships, and aircraft. Those estimates are stored only as claims. They are not Taiwan custody records and therefore do not become exact 1 September 2025 opening inventory.

Every national pool has an unknown opening quantity and a conservation result of `blocked_by_unknowns`. Authorized, possessed, available, ready, deployed, and under-maintenance states are distinct. Organization identity never proves any of those states.

The reported fighter values of 350 excluding trainers and 400 including trainers are nested scopes. They must never be added. The arithmetic difference of 50 is not promoted to a fighter-trainer inventory.

## Deliberate unknowns

The packet leaves national active and reserve strength, Coast Guard personnel, tanker aircraft, rotary-wing lift, ground lift, naval support, integrated air and missile defense, munitions, maintenance throughput, training throughput, and mobilization throughput unresolved. It also contains no exact present location, route, movement, base assignment, theater allocation, mission assignment, readiness percentage, or maintenance percentage.

The seven follow-on submarines and five additional backbone infantry brigades remain plan claims. Their order, delivery, acceptance, manning, possession, availability, and readiness are unknown.

## Mechanical gates

`validate_national_packet.mjs` checks command release boundaries, bookmark-bounded evidence, claim/source closure, one-to-one inventory accounting, unit compatibility, unknown readiness and deployment state, plan quarantine, nested fighter scopes, manifest counts, and the nonaccepted packet state.

Ten adversarial fixtures prove the validator rejects:

1. missing JOCC command;
2. service headquarters releasing an operational mission through an organize/train/equip edge;
3. dated estimates promoted to exact inventory;
4. the derived 50 fighter-trainer difference promoted to inventory;
5. exact location and availability leakage;
6. anonymous national capacity;
7. a planned submarine program promoted to accepted inventory;
8. post-bookmark source leakage;
9. corruption of the fighter nested-scope rule; and
10. premature acceptance.

## Promotion gate

Independent review is still required. No simulation consumer may draw from these national aggregates until a conserved child allocation, lawful authority, actual availability, readiness, support dependencies, and mission assignment are separately resolved.
