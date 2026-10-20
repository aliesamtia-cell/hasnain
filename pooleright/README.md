# pooleright

Automates the Google Workspace **Admin console** reactivation flow (reset password, bypass stuck phone/QR verification) using the **Admin SDK Directory API** instead of incognito browser clicks.

Manual steps this replaces:

| Admin console (manual) | pooleright (API) |
| --- | --- |
| Directory → Users → user → Reset password | `users.patch` with new password |
| Create password | generated or CSV `password` column |
| Ask for change at next sign-in | `changePasswordAtNextLogin: true` (default) |
| Email password to your inbox | optional SMTP to `notifyEmail` + `results/*.json` |
| User opens reset link | user signs in with temp password, then sets final password |
| Stuck on 2SV / QR | `twoStepVerification.turnOff` (when policy allows) |
| Invalidate old sessions | `users.signOut` |

## Prerequisites

1. **Super admin** (or admin with *Reset password* + security scopes) on the Workspace domain.
2. **Google Cloud project** with Admin SDK enabled.
3. **Service account** with **domain-wide delegation**:
   - Client ID authorized in Admin console → Security → API controls → Domain-wide delegation.
   - Scopes:
     - `https://www.googleapis.com/auth/admin.directory.user`
     - `https://www.googleapis.com/auth/admin.directory.user.security`
4. Service account key JSON saved locally (never commit).

## Setup

```bash
cd pooleright
npm install
cp config.example.json config.json
cp users.example.csv users.csv
# edit config.json + users.csv
npm run pooleright
```

## Usage

```bash
# Default: config.json + users.csv, change password at next login (like “Email password”)
npm run pooleright

# Set a final password immediately (skip reset link step)
npm run pooleright -- --no-change-at-login

# Dry run
npm run pooleright -- --dry-run

# Higher parallelism
npm run pooleright -- -j 4
```

CSV format:

```csv
email,password
adam304876@parveg.online,
second.user@parveg.online,MyFixedPass123!
```

Leave `password` empty to auto-generate.

## Output

- Console: per-user OK/FAIL
- `results/batch-<timestamp>.json`: full audit (includes passwords — treat as secret, delete after use)
- Optional email to `notifyEmail` when `smtp` is configured

## Limits (same as console)

`turnOff2Sv` fails if 2SV is **enforced** org-wide, user is in **Advanced Protection**, or user is suspended. Password reset still runs; check `steps` in the JSON result.

## Security

- Rotate/delete `results/` files after successful logins (same as deleting reset emails manually).
- Do not commit `config.json`, service account keys, or result files.
