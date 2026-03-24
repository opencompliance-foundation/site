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

Those narrow controls are then cross-walked outward to public-safe family proxies for ISO 27001, SOC 2, IRAP, and GDPR.

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
