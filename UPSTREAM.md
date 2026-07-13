# Upstream Provenance

Pi Superpowers Lite is a maintained Pi-native fork of
[`obra/superpowers`](https://github.com/obra/superpowers).

- Repository: `https://github.com/obra/superpowers`
- Tag: `v6.1.1`
- Commit: `d884ae04edebef577e82ff7c4e143debd0bbec99`
- License: MIT; see [LICENSE](LICENSE)
- Snapshot source: the local checkout verified during package foundation

## File Classes

`upstream-manifest.json` records a SHA-256 baseline and one of three statuses
for every imported file:

- `unchanged`: byte and mode parity is required; synchronization may update it.
- `lite-modified`: route-proportional workflow text intentionally differs and
  must be reconciled manually when upstream changes.
- `pi-adapted`: Pi lifecycle, tool mapping, or Pi-specific reference behavior;
  it is maintained locally and never overwritten by automatic sync.

The package keeps one skill tree. The Full workflow is retained in that tree;
Lite routing changes how work enters it rather than duplicating it.

## Offline Synchronization

The sync tool does not fetch the network. It accepts a local checkout only and
rejects any source whose HEAD, repository identity, tag, or commit differs from
the immutable pinned baseline. Initialize a fresh package snapshot only after
verifying that exact commit:

```bash
npm run upstream:init -- --source <upstream-checkout>
npm run upstream:check -- --source <upstream-checkout>
npm run upstream:sync -- --source <upstream-checkout>
```

`check` reports additions, deletions, content or mode changes, and manifest
status mismatches. `sync` updates only `unchanged` files and refuses to overwrite
modified or Pi-adapted paths. Run structural, extension, and reference tests
after every manual reconciliation.
