# Control Library Scope

## Current public scope

The current public Lean corridor does not encode ISO 27001 or SOC 2 directly.

It encodes narrow OpenCompliance controls such as:

- scoped administrative MFA,
- scoped password policy,
- a managed web application firewall on the scoped public ingress path,
- unique named infrastructure identities,
- customer and environment segmentation,
- scoped audit logging,
- scoped centralized monitoring,
- hardened TLS ingress,
- managed ingress-boundary attachment,
- administrative-ingress source restriction,
- plaintext transport disabled,
- encryption at rest enabled for scoped customer data stores,
- service-account key hygiene,
- approved-region boundaries,
- backup schedule declarations,
- and a default-deny network-boundary baseline for the cyber-hygiene corridor.

Those narrow controls are then cross-walked outward to public-safe family proxies for ISO 27001, SOC 2, IRAP, GDPR, Cyber Essentials, NCSC CAF 4.0, NIST CSF 2.0, NIST SP 800-53 Rev. 5.1, and the first AI-governance frameworks.

The public Lean package now also imports `LegalLean` and exposes a typed boundary
layer for the same corridor. That layer currently covers
`FormalisationBoundary`-typed identity and logging results, a concrete `Defeats`
example for risk acceptance, a small `Vague` inventory for discretionary
compliance terms, and a first `LegalLean.Solver` instantiation for the
five-claim minimal corpus. That solver now drives the runtime verdict path for
the `minimal`, `failed`, and `stale` synthetic corridors. That is real
progress, but it is still narrower than a full runtime replacement.

The project now also keeps private ISO 27001 and SOC 2 framework-depth reports
that quantify how far the imported seed corpus has been decomposed and promoted
without publishing the imported taxonomy itself. Those reports are not public
artifacts, but they now drive the order of the next depth slices, with the
password-policy, managed-WAF, centralized-monitoring, encryption-at-rest,
key-hygiene, locality, incident, repository-integrity,
unique-infrastructure-identity, segmentation, data-governance,
access-procedure, vulnerability-scanning, and penetration-testing slices now
decomposed or promoted and the next ISO-first work focused on continuity,
device, and malware-monitoring atoms.

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

That pilot now covers 41 public controls across 20 frameworks, and it does
three things at once:

1. it records public-source exact anchors where the source material is actually open enough to review responsibly, including the current GDPR control set, a deeper IRAP operational layer that now reaches secure baselines, configuration exceptions, CI policy, change governance, access-review exports and closure, patch state, and patch exceptions, and the first UK ICO, NIST AI 600-1, and ETSI AI anchors,
2. it records explicit blocker entries where proprietary or non-public framework text still prevents an honest exact-anchor publication, and
3. it still reaches beyond the implemented runtime examples, so the public exact-anchor layer can stay ahead of the current Lean and fixture corridor without pretending those reviewed anchors are already fully proved.

That is a better state than a fake complete mapping corpus.
