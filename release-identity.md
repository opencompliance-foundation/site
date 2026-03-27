# Release Identity

## Purpose

The public verifier release now publishes an explicit trust-root profile registry.

That registry separates:

- the current synthetic reference release signer and release witness identities,
- the environment-override path for non-synthetic release publication,
- the required actor type, role, and trust policy for each root,
- and the fallback rule when a live publication root is not configured.

## Why it matters

OpenCompliance goes beyond OSCAL and beyond static artifact schemas. The verifier
bundle now says not only which files exist, but which signer or witness lane is
expected to stand behind them.

That makes three things inspectable:

1. whether the bundle is still using the synthetic public reference roots,
2. whether an environment-supplied release signer or witness has been selected,
3. and whether the chosen root stays inside the published verifier-service or
   independent-witness trust policy.

## Current boundary

The public reference release still defaults to synthetic roots:

- `oc-synthetic-signer`
- `oc-synthetic-release-witness`

The new live placeholders and environment-override profiles make the migration
path explicit, but they do not yet make the public bundle claim that a real
production publication root is in use.
