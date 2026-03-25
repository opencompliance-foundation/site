# Control Library Scope

## Current public scope

The current public Lean corridor does not encode ISO 27001 or SOC 2 directly.

It encodes narrow OpenCompliance controls such as:

- scoped administrative MFA,
- typed periodic access-review exports,
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
- default-branch protections,
- CI workflow policy constraints,
- secure baseline configuration,
- supported security updates,
- endpoint malware protection,
- AI-generated-content disclosure configuration,
- and a default-deny network-boundary baseline for the cyber-hygiene corridor.

Those narrow controls are then cross-walked outward to public-safe family proxies for ISO 27001, SOC 2, IRAP, GDPR, Cyber Essentials, NCSC CAF 4.0, NIST CSF 2.0, NIST SP 800-53 Rev. 5.1, and the current AI-governance plus AI-assurance frameworks.

The public Lean package now also imports `LegalLean` and exposes a typed boundary
layer for the same corridor. That layer currently covers
`FormalisationBoundary`-typed identity and logging results, a concrete `Defeats`
example for risk acceptance, a small `Vague` inventory for discretionary
compliance terms, a first `LegalLean.Solver` instantiation for the
five-claim minimal corpus, and a public runtime layer that now drives the
verification verdict path for every current synthetic corridor. That is real
progress, but it is still narrower than a released live-evidence verifier.

The project now also keeps private ISO 27001 and SOC 2 framework-depth reports
that quantify how far the imported seed corpus has been decomposed and promoted
without publishing the imported taxonomy itself. Those reports are not public
artifacts, but they now drive the order of the next depth slices, with the
password-policy, managed-WAF, centralized-monitoring, encryption-at-rest,
key-hygiene, locality, incident, repository-integrity,
unique-infrastructure-identity, segmentation, data-governance,
access-procedure, vulnerability-scanning, and penetration-testing slices now
decomposed or promoted, with the current planned public waves now covering
continuity, risk-governance, retention/deletion, facilities, supplier
commitments, ISMS context, project-security, reported-security-concern
handling, outsourced-development governance, stakeholder management,
continual improvement, compliance-requirement inventories,
intellectual-property governance, and remote-working atoms, and the next
ISO-first work moving onward into special-interest-group participation,
disciplinary and conduct follow-through, internal-audit and
customer-support adequacy, facility-workspace governance, and the
remaining governance-and-operations atoms.

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

That pilot now covers 44 public controls across 25 frameworks, and it does
three things at once:

1. it records public-source exact anchors where the source material is actually open enough to review responsibly, including the current GDPR control set, a deeper IRAP operational layer that now reaches secure baselines, configuration exceptions, CI policy, change governance, access-review exports and closure, patch state, and patch exceptions, plus the first NIST AI 100-4 and NIST AI 700-2 anchors alongside the earlier UK ICO, NIST AI 600-1, and ETSI AI layers,
2. it records explicit blocker entries where proprietary or non-public framework text still prevents an honest exact-anchor publication, and
3. it still reaches beyond the implemented runtime examples, so the public exact-anchor layer can stay ahead of the current Lean and fixture corridor without pretending those reviewed anchors are already fully proved, including planned AI provenance, evaluation, and data-quality controls that do not yet have public fixture evidence.

That is a better state than a fake complete mapping corpus.
