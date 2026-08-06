# United States force ledger correction checkpoint

## Disposition

This packet is schema valid and internally consistent. It is not research complete, decision usable, or simulation ready. Validators reject any attempt to consume it as executable inventory while mutually exclusive service totals, readiness, maintenance allocations, and executable support pools remain unresolved.

## Corrected contract surface

The packet now contains 37 organizations, 40 typed organization relationships, 24 equipment taxonomy nodes, 15 inventory records, 15 national accounting deployments, 15 maintenance records, 3 construction records, 15 conservation records, 17 atomic claims, 16 local sources, and 2 contradiction sets.

M01 is corrected by separating the President, the Secretary of Defense as the statutory operational chain authority, the Department of Defense as the administrative institution, the advisory Joint Chiefs, and geographic versus functional combatant commands. M02 is corrected at national resolution through separate National Guard Bureau, governors, state joint force headquarters, adjutants general, and dual status commander nodes. State control under state active duty or Title 32, conditional federal activation under Title 10, federal organize train and equip responsibilities, and dual status coordination remain distinct relationships.

## Public aggregate boundary

The operational slices deliberately contain no exact present locations, routes, or actionable movement. The Air Force mission category ledger conserves to the CRS estimated FY2025 total of 4,832 aircraft. The tanker and airlift split remains unknown within the 1,191 mobility category. Navy battle force ships remain bounded at 287 through 296 because the accepted evidence establishes a request and prior actual, not a contemporaneous 1 September exact. Statutory personnel values are authorization ceilings; assigned and deployable personnel remain unknown.

Army planned training throughput and barracks projects and selected Coast Guard construction plans are represented as capacities or construction records, never as completed opening inventory. Public source conflicts are retained in claim and contradiction records rather than averaged away.

## Remaining blockers

1. Army and Marine Corps mutually exclusive major equipment totals remain unknown.
2. Space Force public aggregate platform totals and Coast Guard whole fleet totals remain unknown.
3. Navy exact bookmark count, class allocation, readiness, and maintenance subsets remain unknown.
4. Tanker and airlift subsets remain unknown until a definition compatible source is accepted.
5. Individual state Guard structures, current status transitions, and mobilization delays remain below the packet resolution.
6. No national accounting deployment is executable until a conserved child allocation and its support package are resolved.

## Verification

`validate_tier_a_force_ledgers.mjs` passes this collecting packet while reporting all promotion gates as false. `validate_national_packet.mjs` enforces the statutory command graph, Guard authority separation, authorized personnel values, source and claim closure, Air Force reconciliation, deployment linkage, conservation identity, and the no geometry or movement boundary. Four adversarial fixtures prove rejection of a missing Secretary of Defense, collapsed Guard authority, anonymous deployment capacity, and aircraft reconciliation mismatch. These gates run under `npm test`.
