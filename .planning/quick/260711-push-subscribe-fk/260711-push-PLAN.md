# Quick Task: Fix push subscribe FK error

**Problem:** `POST /api/push/subscribe` returns 500 with `PushSubscription_userId_fkey` when JWT contains a user id that no longer exists in DB (stale session after reseed).

**Fix:**
1. Verify session user exists in DB before upsert; return 401 if not.
2. Auto-subscribe hook ignores 401 silently.
3. Unit test for missing user case.
