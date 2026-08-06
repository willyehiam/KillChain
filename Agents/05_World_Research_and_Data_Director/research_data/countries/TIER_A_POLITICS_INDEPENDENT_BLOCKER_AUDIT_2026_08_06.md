# Tier A politics independent blocker audit

Audit date: 2026-08-06

Audited baseline: corrected Tier A politics packet through `2f9c038`, rechecked on current main without using a prior correction memo.

Scope: United States and Taiwan war authority workflows, the United States presidential succession packet, role interval semantics, practical influence provenance, acceptance state consistency, and the 2025-09-01 knowledge firewall.

Disposition: **BLOCKED FOR EXECUTION OR PROMOTION**

The packet is substantially more structured than prose-only research, and its acceptance flags correctly remain `needs_review` or `false`. It is not yet an executable authority state machine. Five blocking defects remain.

## B01: United States post-introduction obligations are modeled as entry prerequisites

Evidence:

1. `route_usa_attack_emergency.required_gate_ids` and `route_usa_contested_limited_presidential_force.required_gate_ids` both include `gate_usa_wpr_report_if_triggered` and `gate_usa_wpr_termination_clock`.
2. The route contract says authority changes only `on_completion` after all required gates.
3. The report gate is due 48 hours after a statutory trigger. The termination gate completes only when forces are removed by the deadline or continuation is separately authorized.
4. The cited primary authority is `src_usa_war_powers_resolution`, especially the reporting and termination provisions represented in the packet as 48 hours, 60 days, and a conditional withdrawal extension of no more than 30 days.

Impact:

An engine following the current structure cannot activate temporary authority at the introduction of forces. It must wait until a later report and ultimately withdrawal or separate authorization. Conversely, an engine that ignores list order must invent temporal semantics outside the research packet. The description “executable research inputs” is therefore not true for these routes.

Exact correction packet:

1. Give every gate a phase: `precondition`, `activation`, `post_activation_obligation`, `continuation_condition`, or `termination_condition`.
2. Replace the flat `required_gate_ids` contract with typed transitions.
3. Record `forces_introduced_at` as the report anchor when the statutory reporting trigger is met.
4. Calculate `report_due_at` from that anchor.
5. Record the termination anchor as the date the report was submitted or was required to be submitted, preserving the unresolved legal or factual branch where necessary.
6. Calculate the 60-day deadline and separately model the conditional 30-day withdrawal extension.
7. Activate the attack-emergency or contested state before post-activation obligations mature. Failure of a later obligation must cause a defined violation, termination, or escalation state rather than retroactively preventing activation.
8. Keep the contested Article II route explicitly contested and never equivalent to congressional authorization.

## B02: the United States WPR clock has no executable anchor

Evidence:

1. `gate_usa_wpr_report_if_triggered` stores `deadline_hours: 48` but no anchor event identifier.
2. `gate_usa_wpr_termination_clock` stores `base_deadline_days: 60` and `withdrawal_extension_max_days: 30` but no anchor gate, timestamp field, or transition rule.
3. `unknown_usa_wpr_clock_start` expressly says the start can be fact-and-law dependent.
4. No route says whether an unresolved start blocks computation, creates a range, or chooses a conservative deadline.

Impact:

The engine can select arbitrary deadlines or never start the clock. That makes both premature termination and indefinite continuation mechanically possible.

Exact correction packet:

1. Add `anchor_event_type`, `anchor_event_id`, `anchor_status`, and `anchor_time` to every timed gate.
2. Add an explicit `unknown_anchor` state that cannot be coerced to zero, false, or no deadline.
3. Define conservative and permissive deadline bounds when the anchor remains disputed; preserve both until adjudicated.
4. Add validator failures for missing anchors, impossible deadline ordering, negative durations, and an unresolved anchor silently treated as no clock.

## B03: Taiwan temporary emergency authority is represented only after ratification

Evidence:

1. `route_twn_emergency_decree.required_gate_ids` includes the presidential decree and `gate_twn_legislative_ratification_within_ten_days` in one flat prerequisite list.
2. Its only completion state is `accepted_if_ratified_otherwise_ceases`.
3. The ratification gate correctly records `deadline_days: 10` and `failure_effect: decree_ceases_forthwith`, citing `src_twn_additional_articles`.

Impact:

The route cannot represent the constitutionally important interval after issuance and before ratification. It either withholds all effect until the legislature acts or invents an interim state outside the packet.

Exact correction packet:

1. Transition after the danger fact, Executive Yuan Council resolution, and presidential issuance to `provisionally_effective_pending_ratification`.
2. Store `issued_at` and calculate `ratification_due_at = issued_at + 10 days`.
3. Transition timely ratification to `ratified_effective`.
4. Transition rejection or deadline expiry to `ceased_forthwith`, preserving the event history and any consequences already produced during provisional effect.
5. Add validator fixtures for pre-ratification use, timely ratification, rejection, expiry, and a ratification timestamp later than the deadline.

## B04: Taiwan immediate defensive command can bypass the unresolved formal-war transition indefinitely

Evidence:

1. `route_twn_immediate_defensive_command` becomes `defensive_command_accepted_formal_war_status_separate` after a presidency-controlled fact finding and presidential direction.
2. The factual gate distinguishes attack or operationally imminent threat from political tension, which is a useful safeguard.
3. The route has no scope field, review deadline, termination event, continuation gate, or mandatory escalation transition.
4. `unknown_twn_defense_to_formal_war_transition` states that the controlling threshold is not established by packet sources.
5. `src_twn_constitution_main_text`, `src_twn_president_authority`, and `src_twn_legislative_functions` support separate command and formal declaration roles, but the packet does not yet convert that distinction into a bounded state machine.

Impact:

Once the executive establishes its own imminent-defense predicate, an engine can continue operations forever without visiting the Executive Yuan and Legislative Yuan gates of the formal declaration route. The acceptance rule that command is not a declaration labels the distinction but does not enforce it.

Exact correction packet:

1. Until independent constitutional review resolves the transition, mark the route `research_only_non_executable` rather than accepted for gameplay.
2. After review, add typed `defensive_scope`, `activated_at`, `review_due_at`, `termination_conditions`, and `formal_transition_conditions`.
3. Require an independently represented attack or imminent-threat event. A presidency-created fact record alone must not manufacture its own trigger.
4. Reject actions outside defensive scope, repeated activation without a new trigger, and continuation after the review deadline without the next lawful route.

## B05: mutable live pages cannot prove the 2025 opening-state firewall

Evidence:

1. Several opening sources have no `published_at` and were accessed on 2026-08-06, after the 2025-09-01 bookmark.
2. Mutable role sources include `src_usa_white_house_administration`, `src_usa_white_house_cabinet`, `src_usa_house_democratic_leader`, and `src_twn_new_taipei_hou`.
3. Reliability notes acknowledge that some pages are live, but the records contain no immutable snapshot URL, content hash, capture timestamp at or before the bookmark, or dated corroborating event for every imported role.
4. The validator rejects an explicit post-bookmark `published_at`, but treats a missing publication date as temporally safe.
5. Legal texts with no publication date are a separate case. Their effective law date can be proven without treating a live officeholder page as timeless.

Impact:

The firewall can detect a declared post-bookmark date but cannot prove that a live page retrieved eleven months later reflects its bookmark contents. Current `bookmark_firewall_passed: false` is correct. Promotion would not be defensible.

Exact correction packet:

1. For mutable opening-state sources, require either an immutable archive captured on or before the bookmark or a dated official source proving the fact at the bookmark.
2. Store `snapshot_at`, `content_hash`, and `archive_url` for archived content.
3. For laws, store `effective_from` or a historically valid edition and distinguish that from mutable role pages.
4. Add a source mutability class and make the validator reject `live_mutable` opening evidence without temporal proof.
5. Preserve unknown where a dated snapshot cannot be recovered. Do not infer continuity from a 2026 live page.

## Acceptance-state result

No false promotion was found. Both country manifests remain `collecting`; both politics lanes remain `needs_review`; bookmark firewall, independent review, and authority contract flags remain false. This consistency prevents the blockers above from silently entering accepted simulation state.

## Immediate release gate

Do not set any of the following to true until B01 through B05 are corrected and independently reviewed:

1. `bookmark_firewall_passed`
2. `independent_review_complete`
3. `politics_lane_authority_contract_reviewed`
4. `presidential_succession_reviewed`
