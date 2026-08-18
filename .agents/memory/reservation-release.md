---
name: Reservation release discipline
description: Any volume/funds decrement made when opening a trade must be released exactly once on cancel AND expiry.
---

**Rule:** Whenever a server-side RPC decrements a reservation (e.g. `offers.remaining_amount` on trade open), every terminal path — cancellation, expiry, dispute resolution — must restore it, and each restore must be guarded to run exactly once.

**Why:** Completion reviews rejected work twice for this: first for never restoring reserved listing volume (buyers could burn a seller's listing by cancelling), then for a double-restore race (the expiry cron preselected rows then unconditionally updated them, so a cancel racing an expiry restored volume twice → overselling).

**How to apply:**
- Restores that follow `transition_demo_trade()` are safe — invalid repeat transitions raise before the restore line.
- Batch/cron paths that bypass the state machine must claim rows atomically: `UPDATE ... WHERE id = X AND state NOT IN (terminal) RETURNING id`, and only act when the claim returned a row.
- Lock the reserved row with `FOR UPDATE` at decrement time so concurrent takers can't double-spend.
