# Tier A politics independent full audit

Audit date: 2026-08-06

Baseline: corrected Tier A politics packet through `2f9c038`, independently rechecked on current main.

Method: direct inspection of the United States and Taiwan evidence registries, politics records, opening bookmarks, authority workflows, the United States succession packet, manifests, lane matrices, validators, and adversarial mutations. No audited politics record was changed.

## Final disposition

**BLOCKED FOR EXECUTION OR PROMOTION.**

The five blockers and their exact correction packets are recorded in `TIER_A_POLITICS_INDEPENDENT_BLOCKER_AUDIT_2026_08_06.md`. This report adds major and minor findings, confirms what is correct, and records validator coverage added by this audit.

## Confirmed correct

1. Both country manifests remain `collecting`.
2. Both politics lanes and politics records remain `needs_review`.
3. Bookmark firewall, independent review, and authority-contract acceptance flags remain false and agree across the bookmark and manifest.
4. United States treaty, policy, appropriations, and Taiwan Relations Act branches do not by themselves create domestic force authority.
5. Taiwan foreign support does not automatically transfer command, complete the formal-war route, or create United States intervention.
6. The United States succession office list has all 18 statutory offices in the correct order.
7. Speaker and President pro tempore resignation conditions are represented.
8. The packet distinguishes vice-presidential succession from statutory officers acting as President.
9. No actor has accepted practical influence. All 41 United States and Taiwan actor records leave that field unaccepted.
10. No explicit source publication date after 2025-09-01 is currently imported into the opening packet.

## Blocking findings

See the separate blocker audit for B01 through B05:

1. United States post-introduction WPR obligations are modeled as entry prerequisites.
2. The WPR report and termination clocks lack executable anchors.
3. Taiwan emergency decree authority lacks a provisional pre-ratification state.
4. Taiwan immediate defensive command lacks a bounded transition to formal authority.
5. Mutable live pages retrieved after the bookmark lack immutable temporal proof.

## Major findings

### M01: full office order does not mean full opening succession state

Evidence:

The 18 offices are ordered correctly, but ranks 5 and 8 through 17 have `opening_actor_id: null` with only `not_accepted_in_active_actor_roster`. Eleven offices therefore have no opening officeholder identity, eligibility disposition, or evidence-backed unknown.

Impact:

A succession event reaching any of those offices cannot resolve. “Not in the gameplay actor roster” is not a constitutional qualification and must not stand in for research.

Exact correction packet:

1. Separate the succession-person ledger from the curated gameplay actor roster.
2. Populate each opening officeholder from dated evidence or store a typed `unknown` with a reason.
3. Store Senate-confirmation timing, constitutional eligibility disposition, House impeachment status, availability, and qualification result separately.
4. Require every rank to resolve to `qualified`, `disqualified`, `unavailable`, or `unknown`; never infer qualified from office title alone.

### M02: succession triggers do not select machine-readable outcomes

Evidence:

Rank 1 uses `succeeds_or_acts_depending_on_trigger`, while `trigger_classes` is a top-level list with no trigger-to-result map. The displacement rule is prose. Nodes do not encode transition targets, temporary duration, or how later qualification changes the acting officer.

Impact:

An engine must invent whether the Vice President becomes President or only acts, and cannot deterministically replay later displacement.

Exact correction packet:

1. Add per-trigger transitions for death, resignation, removal, inability, and failure to qualify.
2. Separate Twenty-Fifth Amendment inability states from constitutional vacancy.
3. Encode statutory acting service, later Speaker or President pro tempore displacement, and terminal qualification as events.
4. Add deterministic fixtures for every trigger and for later displacement.

### M03: succession packet source closure is incomplete

Evidence:

Node evidence cites `src_usa_rubio_swearing_2025`, `src_usa_hegseth_swearing_2025`, and `src_usa_white_house_cabinet`, but those three sources are absent from the succession packet’s top-level `source_ids`.

Impact:

Consumers using the top-level provenance manifest omit evidence used by ranks 4, 6, 7, and 18.

Exact correction packet:

Require the top-level source set to equal the union of node, rule, distinction, and unresolved-question sources. Add a source-closure validator and negative fixture.

### M04: United States enactment semantics cannot represent a veto override

Evidence:

`gate_usa_measure_becomes_law` requires both Presidency and Congress, yet its completion evidence permits either signature or veto override. The separate presidential request-or-accept gate also treats an enacted declaration or presentment record as presidential completion evidence.

Impact:

The engine can incorrectly require presidential assent where Congress overrides a veto, or double-count enactment.

Exact correction packet:

1. Model presentment, signature, veto, return, and two-thirds override as alternative branches.
2. Do not require a presidential request for a congressional declaration or authorization.
3. Distinguish executive advocacy from the constitutional enactment path.
4. Cite Article I presentment evidence on both declaration and authorization routes.

### M05: authority scope is a label rather than an enforceable constraint

Evidence:

United States authorization completion says `accepted_within_statutory_scope`, but no route stores objective, geography, target class, forces, duration, reporting, sunset, or prohibited actions. Taiwan immediate defense similarly lacks a structured defensive scope.

Impact:

Once a route is marked complete, a consumer can use it as unlimited authority.

Exact correction packet:

Add a typed authority scope object with allowed objectives, geographic bounds, force categories, action classes, temporal bounds, reporting duties, termination conditions, and an explicit unknown state for each unresolved dimension. Every operation must be checked against that object.

### M06: unresolved Taiwan sequences are still described with accepted outcomes

Evidence:

The formal declaration route preserves unresolved gate order, and martial law preserves unresolved approval-before versus confirmation-after timing. Yet their completion states use `accepted_only_after_all_three_gates` and `accepted_with_legislative_approval_or_confirmation` without an executable sequence or interim state.

Impact:

A consumer can interpret the accepted label as permission even though the controlling sequence remains unreviewed.

Exact correction packet:

Keep each route `research_only_non_executable` until independent constitutional review supplies typed transitions. For martial law, separately model prior approval and permitted post-declaration confirmation branches with their factual predicates and deadlines.

### M07: compound role claims collapse distinct office intervals

Evidence:

`claim_usa_actor_rubio_role` uses one `holds_offices` interval beginning 2025-05-01 for Secretary of State and Acting National Security Advisor, although the packet’s own swearing source dates the State role to January. `claim_twn_actor_lai_role` similarly combines President and DPP Chair in one interval. A single interval cannot accurately describe offices with different start or end dates.

Impact:

Historical replay, succession, authority membership, and role changes can activate or terminate multiple offices incorrectly.

Exact correction packet:

Create one claim per actor-office pair. Each claim needs its own `effective_from`, `effective_to`, interval disposition, source set, and confidence. Prohibit plural office predicates when role intervals differ.

### M08: practical-influence provenance can be bypassed through `relevance`

Evidence:

All `practical_influence` fields are safely unaccepted, but free-text `relevance` values include judgments such as `presidential_gatekeeper`, `party_and_national_security_leader`, `third_party_and_legislative_pivot_leader`, and `major_opposition_local_executive`. Those are practical-influence assertions, not merely office identity.

Impact:

An application can import unsupported influence through `relevance` while the source-family validator reports success because it checks only `practical_influence`.

Exact correction packet:

1. Restrict institutional relevance to a closed enum derived from office, succession, or formal membership.
2. Move gatekeeper, pivot, national-figure, major, and similar influence judgments into `practical_influence`.
3. Require at least two genuinely independent source families for accepted influence.
4. Validate declared family IDs against the families derived from cited source IDs.

### M09: “accepted” evidence counts conflict with review state

Evidence:

Both manifests use `accepted_source_count` and `accepted_claim_count` while the country status is `collecting`, the lane is `needs_review`, and independent review is false.

Impact:

Consumers can mistake registry population for accepted simulation evidence.

Exact correction packet:

Rename these to `registered_source_count` and `registered_claim_count`, or count only claims with a defined accepted state. Add separate rejected, unresolved, and review-pending counts.

### M10: bookmark actor membership conflates researched, present, known, and playable

Evidence:

`bookmark_state.political_actors` mirrors the entire politics roster. There are no separate opening-state sets for researched actors, actually present officeholders, player-known actors, and playable or selectable actors.

Impact:

The list can leak research knowledge to the player or treat a relevance-only former leader as an active decision node.

Exact correction packet:

Add separate typed collections for `researched_actor_ids`, `opening_officeholder_ids`, `player_known_actor_ids`, and `playable_actor_ids`. Require an explicit derivation and firewall rule for each.

## Minor findings

### N01: succession packet lacks a stable workflow identifier

The file has no `workflow_id`. Add one and validate uniqueness and bookmark binding.

### N02: succession ambiguity has no structured unresolved-question section

Unlike the authority workflows, the succession packet has no `unresolved_interpretations` array or acceptance rules. Move eligibility, displacement, and trigger ambiguity out of prose and into structured questions with sources and dispositions.

### N03: descriptions overstate executability

Both authority workflow `purpose` fields call the records “executable research inputs.” Until the blockers are corrected, use “structured research inputs for future executable modeling.” This avoids a false capability claim without discarding the useful structure.

### N04: live-source warnings are prose-only

Reliability notes acknowledge mutable pages, but no machine-readable `mutability`, `snapshot`, or temporal-proof field exists. The B05 correction should make this enforceable.

## Validator improvements added by this audit

The audit extends the authority validator and its mutation suite without changing audited politics records. New guards cover:

1. exact agreement between declared and derived practical-influence source families;
2. missing practical-influence sources;
3. post-bookmark practical-influence evidence;
4. inverted, invalid, and post-bookmark role intervals;
5. post-bookmark authority-workflow and succession evidence;
6. authority-branch provenance closure;
7. Taiwan foreign-support authority bypass;
8. United States Taiwan-policy omission of domestic authority routes;
9. bookmark and manifest authority-review consistency.

These guards do not repair B01 through B05 or M01 through M10. They prevent additional semantic corruption while the correction packets are implemented.

