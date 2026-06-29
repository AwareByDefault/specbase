## 1. Invariant semantics & parsing

- [ ] 1.1 Give `type: invariant` semantics; default enforcement `kind` to `lint`
- [ ] 1.2 Parse hybrid ADR body (Decision + compliant/violating examples)
- [ ] 1.3 Validate: warn when a Decision lacks a violating example
- [ ] 1.4 Free-form sub-labels (`invariant.*`)

## 2. Context injection

- [ ] 2.1 Compose invariant-derived guardrails into working context at load time (reuse rules-injection)
- [ ] 2.2 De-dup against hand-written context by invariant id
- [ ] 2.3 Guarantee `config.yaml` is never mutated
- [ ] 2.4 `inject: false` frontmatter opt-out

## 3. Coverage integration

- [ ] 3.1 Invariant "covered" = active lint binding AND injected; else aspirational

## 4. Tests

- [ ] 4.1 Hybrid body parse + missing-violating-example warning
- [ ] 4.2 Invariant appears in working context; config.yaml unchanged
- [ ] 4.3 Hand-written + generated coexist without duplication
- [ ] 4.4 Aspirational vs covered invariant reporting

## 5. Release

- [ ] 5.1 Add changeset
