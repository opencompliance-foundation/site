# Control Library Scope

## Current public scope

The current public Lean corridor does not encode ISO 27001 or SOC 2 directly.

It encodes narrow OpenCompliance controls such as:

- scoped administrative MFA,
- scoped audit logging,
- hardened TLS ingress,
- service-account key hygiene,
- approved-region boundaries,
- and backup schedule declarations.

Those narrow controls are then cross-walked outward to public-safe family proxies for ISO 27001, SOC 2, IRAP, GDPR, Cyber Essentials, NCSC CAF 4.0, NIST CSF 2.0, NIST SP 800-53 Rev. 5.1, and the first AI-governance frameworks.

The public Lean package now also imports `LegalLean` and exposes a typed boundary
layer for the same corridor. That layer currently covers
`FormalisationBoundary`-typed identity results, a concrete `Defeats` example for
risk acceptance, a small `Vague` inventory for discretionary compliance terms,
and a first `LegalLean.Solver` instantiation for the five-claim minimal corpus.
That is real progress, but it is still narrower than a full runtime replacement.

## Interpretation rule

This means the current public corridor is:

- useful,
- honest,
- machine-checkable,
- but not clause-complete or criterion-complete.

The Lean proofs attach to the OpenCompliance control layer. They do not yet claim that an entire source framework clause or criterion has been formally encoded end to end.

## State-of-the-art target

The target model is:

1. decompose source requirements into atomic obligations,
2. attach exact source anchors,
3. route each atomic obligation into proof, attestation, judgment, or mixed,
4. formalize only the decidable slice in Lean 4,
5. keep the remaining slices explicit in the same verification graph.

That is the direction the public mapping metadata now points toward.

## Exact-anchor pilot

The specs now also carry a first exact-anchor review pilot.

That pilot does three things at once:

1. it records public-source exact anchors where the source material is actually open enough to review responsibly, and
2. it records explicit blocker entries where proprietary or non-public framework text still prevents an honest exact-anchor publication.
3. it still reaches beyond the implemented runtime examples, so the public exact-anchor layer can stay ahead of the current Lean and fixture corridor without pretending those reviewed anchors are already fully proved.

That is a better state than a fake complete mapping corpus.
