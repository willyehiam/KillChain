# Tier A politics promotion blocker corrections

Date: 2026-08-06

Baseline audit: `TIER_A_POLITICS_INDEPENDENT_BLOCKER_AUDIT_2026_08_06.md` at commit `b55c78d`

Disposition: corrected research packet, still blocked from promotion pending a new independent audit

## B01 and B02: United States War Powers Resolution timing

The United States workflow now uses typed transitions instead of one flat prerequisite list. Attack emergency and contested Article II routes activate after their activation gates. The 48 hour report, regular consultation, continuation authorization, 60 day termination condition, and conditional withdrawal extension are later obligations or transitions. Failure after activation records a violation or termination state and never retroactively erases the activation event.

The report clock records `forces_introduced_at`. Its due time is anchored to the independently represented force introduction event. The termination clock is anchored to the earlier of the report submission time and the time the report was required. The 30 day withdrawal extension is a separate conditional state beginning at the 60 day deadline and requires the statutory certification represented by the source.

Disputed anchors remain `unknown_anchor`. Conservative and permissive deadline bounds are preserved, and neither an unresolved anchor nor a missing candidate can become zero, false, or no deadline. Validators reject missing anchors, negative durations, inverted ordering, and post introduction obligations placed in the activation transition.

The contested Article II route remains explicitly contested and can never be labeled equivalent to congressional authorization.

## B03: Taiwan emergency decree lifecycle

The Taiwan workflow now enters `provisionally_effective_pending_ratification` after the danger fact, Executive Yuan Council resolution, and presidential issuance. Issuance records `issued_at`; the ratification clock calculates `ratification_due_at` ten days later.

Timely ratification transitions to `ratified_effective`. Legislative rejection, deadline expiry, or attempted late ratification transitions to `ceased_forthwith`. The append only event history preserves consequences produced during provisional effect.

Regression fixtures cover provisional use, timely ratification, rejection, expiry, and late ratification.

## B04: Taiwan immediate defensive command

The unresolved route is now `research_only_non_executable`. It cannot change gameplay authority until independent constitutional review resolves its scope and transition threshold.

Its trigger must be an independent world state attack or operationally imminent threat event. The Presidency cannot create or adjudicate its own trigger. The research candidate records activation time, bounds the candidate purpose to immediate defense, rejects expanded or offensive objectives, forbids repeated activation without a new trigger, and points to the formal declaration route. Because the sources do not establish a review deadline or transition threshold, those values remain explicit unknowns and indefinite continuation is forbidden rather than silently allowed.

## B05: mutable opening sources

Every United States and Taiwan politics source now has a mutability class. Historically valid legal instruments carry effective date proof. Dated publications and datasets carry their prebookmark publication date. Live mutable sources retrieved after the bookmark without an immutable prebookmark snapshot are quarantined and cannot initialize claims, workflows, profiles, bookmark states, institutions, actor records, or succession records.

Active opening uses of the cited live pages were replaced with dated prebookmark records:

1. the 2025 Congressional Record inauguration entry for Donald Trump and JD Vance
2. the 2025 Congressional Record selection of Hakeem Jeffries as House minority leader
3. dated Senate confirmation records for Pamela Bondi and Kristi Noem
4. the August 29, 2025 New Taipei City release identifying Mayor Hou Yu-ih
5. historically valid Taiwan constitutional texts for institutional authority

The live pages remain in the evidence registry only as quarantined sources. Continuity cannot be inferred from their 2026 contents.

## Acceptance state

No acceptance flag has been promoted. Both country packets remain `collecting`; both politics lanes remain `needs_review`; bookmark firewall, independent review, authority contract review, and succession review flags remain false.

## Verification

The authority validator and 24 adversarial regressions pass, including five emergency decree state fixtures. The full repository suite must pass again after publication from an exact remote checkout. A new independent audit is required before any promotion flag changes.
