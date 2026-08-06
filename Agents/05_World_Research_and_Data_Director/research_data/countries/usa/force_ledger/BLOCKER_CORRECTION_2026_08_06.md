# United States national force inventory blocker correction

Correction date: 2026-08-06

Corrects the seven blockers in `INDEPENDENT_AUDIT_2026_08_06.md`. Scope remains public, countrywide aggregate accounting at the 1 September 2025 bookmark. No present location, movement, mission, or readiness is introduced.

## Disposition by blocker

### B01 — Navy pseudo-range: corrected

- Removed the 287–296 opening range.
- Opening battle-force quantity is explicit unknown.
- The FY2025 request and FY2024 actual remain separately typed historical/planning claims recovered from a postbookmark report. They are unavailable to player knowledge and forbidden as endpoints, samples, interpolation inputs, or opening truth.
- Regression coverage rejects promotion back to a pseudo-range and rejects postbookmark inventory evidence.

### B02 — Air Force 4,832 estimate: corrected

- The parent and six mission-category opening quantities are unknown and typed `all_components`.
- The 4,832 fiscal-year estimate and its six categories remain claims only. The categories reconcile arithmetically to the parent claim but are not exact point observations.
- Active, Guard, and Reserve allocations remain unknown. Tanker and airlift remain unresolved subsets.
- Regressions reject claim divergence, estimate-to-opening promotion, component collapse, and missing structural parent links.

### B03 — Reserve and Guard authority: corrected

- Section 10101 edges are identity/support relationships with no order, reassignment, or release powers.
- Full mobilization, partial mobilization, operational mission call, and Guard federal-service call routes are separately modeled under 10 U.S.C. §§12301, 12302, 12304, and 12406.
- Section 12401 supplies status semantics only and is never the sole activation authority.
- `guard_status_state_machine.json` makes state active duty, Title 32, and Title 10 mutually exclusive for every conserved child allocation. Partial transitions cannot duplicate the parent pool.
- Regressions reject identity-statute activation provenance and simultaneously active state/federal status semantics.

### B04 — Army annual training plan: corrected

- Removed the 22-rotation target from opening inventory, deployment, maintenance, and conservation.
- `training_plans.json` retains a non-executable fiscal-year plan with completed, scheduled, remaining, canceled, and available quantities all explicit unknown.
- Regression coverage rejects promotion to ready/executable capacity.

### B05 — Mutable live sources: corrected

- Both live Department of Defense discovery pages are machine-readably quarantined, unavailable to the player at the bookmark, and stripped of unsupported observation intervals.
- Organizations, relationships, equipment, and opening inventory use cutoff-safe dated or statutory evidence instead.
- Regression coverage rejects restored live-page intervals and player availability.

### B06 — Expiration accounting: corrected

- All 42 opening inventory, deployment, and maintenance records were source-rechecked and receive a 6 November 2026 review date.
- The manifest computes rather than hard-codes the expired-record count at its declared review time. Current count is zero.
- Manifest record counts are cross-checked against every loaded dataset.
- Regression coverage rejects an expired child with a zero summary.

### B07 — Semantic validator coverage: corrected

The validator now loads organizations, relationships, equipment, inventory, deployments, maintenance, construction, conservation, sources, claims, contradictions, training plans, and the Guard status machine. Sixteen mandatory negative fixtures pass, including all eight independent-audit corruptions:

1. Air Force parent claim divergence.
2. Fabricated assigned personnel.
3. Postbookmark source leakage.
4. Fabricated maintenance quantity.
5. Unsupported construction completion.
6. Executable training-plan promotion.
7. Missing aircraft parent link.
8. Identity statute substituted for activation authority.

Additional fixtures cover the Navy pseudo-range, mutable-source interval leakage, expired-child summary mismatch, incompatible Guard status, missing Secretary of Defense, National Guard Bureau command collapse, and orphan deployment.

## Verification

- `node .../usa/force_ledger/validate_national_packet.mjs`: PASS
- `node .../usa/force_ledger/test_national_packet_regressions.mjs`: PASS, 16 of 16 mandatory negative fixtures rejected
- `npm run validate:research-foundation`: PASS, including USA, China, and Taiwan Tier A force ledgers
- `npm test`: PASS on published main `ec0206a`, including the opening-posture firewall, 34 authority regressions, politics regressions, typecheck, 43 simulation tests, production build, and rendered-HTML test

## Release state

The packet remains `collecting`, `internally_consistent: false`, `research_complete: false`, `decision_usable: false`, and `simulation_ready: false`. Independent re-audit is the exact nontechnical gate for removing the internal-consistency blocker. Incomplete national equipment totals, unresolved tanker/airlift allocation, readiness, support availability, and conserved mission-child allocation remain later research gates.
