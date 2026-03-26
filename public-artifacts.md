# OpenCompliance Public Artifacts

OpenCompliance publishes through explicit public export bundles, not by mirroring the whole private working tree.

## Public repos

- `site`: static docs and crawler-facing discovery files
- `governance`: charter, governance, conflicts, sponsor model, release policy
- `specs`: open specs, schemas, control boundaries, exact-anchor review material
- `examples`: synthetic ExampleCo corridors, lifecycle/signing packs, versioned verifier release bundles
- `conformance`: validators and public conformance vectors
- `evidence-schema`: typed evidence-claim schemas and claim-type payload schemas
- `lean4-controls`: public Lean 4 corridor and typed LegalLean-backed boundary layer

## Rules

1. Publication is allow-list based.
2. If a path is not in a manifest, it does not ship.
3. Boundary checks run before export or publish.
4. Public example data stays synthetic unless explicitly cleared.
5. The versioned verifier bundle is part of the public contract, not an ad hoc snapshot.

## Entry points

Use the stable wrapper scripts under `scripts/public-mirror/`:

```bash
python3 projects/dev/opencompliance/scripts/public-mirror/verify_public_boundary.py --repo-root /workspaces/life-core
python3 projects/dev/opencompliance/scripts/public-mirror/export_public_repos.py --repo-root /workspaces/life-core --repo site --destination-root /tmp/opencompliance-public
```

Those wrappers delegate to the canonical implementation under `foundation/scripts/` so the public-mirror contract has one obvious operator path.

## Source of truth

- HTML overview: `docs/public-artifacts.html`
- Export layout: `foundation/EXPORT_LAYOUT.md`
- Allow-lists: `foundation/export-manifests/*.txt`
- Canonical scripts: `foundation/scripts/export_public_repos.py`, `foundation/scripts/verify_public_boundary.py`
