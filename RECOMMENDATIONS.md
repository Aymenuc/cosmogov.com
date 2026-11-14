# Claude review follow-up

This tracks the implementation gaps in [Claude's handoff](https://github.com/Aymenuc/cosmogov.com/blob/claude/funny-hypatia-dgdual/AGENTS.md). That review describes an earlier commit; its landing and portal design work is already incorporated. The new work preserves that design.

| Recommendation | Current state |
| --- | --- |
| Signed sessions and revocation (6.1) | Implemented: expiring signed tokens, per-token logout and all-session revocation. A shared production `SESSION_SECRET` still needs host configuration. |
| Remove HTTP seeds and public official codes (6.2) | Implemented: seed handlers removed; administrator-issued, hashed, email-bound, expiring, single-use official invitations. Historical deployed accounts have not been audited here. |
| Ballot and email exposure (6.3) | Implemented in reviewed proposal, membership, debate and leaderboard responses: aggregate proposal results, caller-only ballots, no email fallbacks. Account-linked ballots are explicitly described. |
| Participation integrity (6.4) | Implemented baseline: no voting XP, supported methods enforced, transactional personal budget allowance and reviewed-signature thresholds. This does not implement anonymous or verifiable elections or independently verified identity. |
| Hardening (6.5) | Persistent rate limits on reviewed authentication/participation/mission writes; role checks tested for every exported admin/government handler; strict mode enabled; application type errors fixed and build error suppression removed. This is not a claim that every legacy API has been rewritten. |
| Manual and edited forms (7.0) | Implemented: immutable versions, preview, reorder/add/remove fields, separate manual-save quota. |
| Close, unpublish, delete, export (7.0) | Implemented: lifecycle controls, exact-title mission deletion and organizer CSV exports with spreadsheet-formula neutralization. |
| Sensitive-question review (7.0) | Implemented pattern check, stated need and organizer-only sharing for flagged forms. This is a review aid, not exhaustive detection or a legal basis. |
| AI traceability (7.0) | Provider, model and prompt version recorded; contributor metadata replaced with labels before calls. Names inside source text can still be sent, as explained in the input dialog. |
| Response privacy and retention (7.0) | Per-form audience, stored submission notice, expiry filtering and authenticated scheduled cleanup. Existing forms preserve their original terms. |
| Task history (7.0) | Transactional actor/time history and required completion evidence. Reports remain member-provided. |
| Matching (7.0) | Opt-in shared-word suggestions, organizer invitation, participant acceptance and atomic task claim. No ranking or automatic assignment. |
| Follow-through and templates (7.0) | Permitted mission outcomes appear in Accountability; selected adopted plan/form text can be reused with credit, without copying participation data. |
| Live staging (7.0) | Runner implemented and tested against the isolated local provider. Live host, deployment migrations, real model quality/search and 120-second hosting support remain unverified until a staging URL and host configuration are available. |

The later roadmap remains separate: verifiable sortition (7.1), consensus mapping (7.2), a real identity-provider adapter (7.3), advanced tallies and a public ballot record (7.4), cross-device follows/status notifications/open-data exports (remaining 7.5), inclusion channels and pilot languages (7.6), the organization offer (7.7) and the public AI register (7.8). These are not represented as delivered by this follow-up.

Operational setup and verification commands are in [MISSION_STUDIO.md](./MISSION_STUDIO.md); integrity behavior and limits are in [CIVIC_INTEGRITY.md](./CIVIC_INTEGRITY.md). Validation results are recorded in [worklog.md](./worklog.md).
