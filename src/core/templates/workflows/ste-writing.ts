/**
 * STE writing skill (add-ste-instrument, spec `agents.ste-writing`).
 *
 * The operational artifact of the `agents.ste-writing` pair: a SKILL.md that
 * instructs an agent to produce Simplified Technical English (ASD-STE100)
 * prose. It is registered in skill-generation under the governed spec model so
 * it is emitted as an invocable skill, and `specbase ste-lint` (whose contract
 * `behavior.cli.ste-lint` owns) is its counting companion.
 *
 * The skill HELPS satisfy `ops.ste` (Specbase writes its docs in STE) but it is
 * NOT ops.ste's enforcement — the linter and the clarity review are.
 */
import type { SkillTemplate } from '../types.js';

/**
 * Shared body: the STE mandate (short active sentences; no marketing adjectives;
 * no banned complex words) and the trigger (any time the agent writes or
 * revises user-facing or internal prose).
 */
const STE_WRITING_BODY = `Write in Simplified Technical English (STE, ASD-STE100). STE is the
controlled-language standard that keeps prose short, active, and unambiguous.

**Trigger**: apply this skill whenever you WRITE or REVISE prose — READMEs, skill
docs, generated agent docs, CLI copy, design notes, or any text a human or agent
will read. Do not wait to be asked.

## The rules

- **Short active sentences.** One topic per sentence. Prefer the active voice:
  "the CLI prints the report", never "the report is printed by the CLI".
- **No marketing adjectives.** Drop words like *seamless*, *robust*, *powerful*,
  *cutting-edge*, *effortless*, *world-class*, *state-of-the-art*,
  *game-changing*, *first-class*. Say what the thing does, do not grade it.
- **No banned complex words.** Prefer the plain equivalent: *begin* for
  "commence", *use* for "utilize"/"leverage", *make sure* for "ensure",
  *before* for "prior to", *get* for "obtain", *also* for "additionally".
- **No phrasal-verb slop.** Say "start", not "kick off"/"spin up"; say "remove",
  not "tear down"; say "distribute", not "roll out".
- **No modal hedging.** Never write "it is important to note that" or "please
  note that"; just state the thing.
- **Few passives and nominalizations.** Prefer the verb: "the committee decided",
  not "a decision was made by the committee" or "the committee made a decision".
- **No em-dash slop.** Prefer two short sentences or a comma over an em dash.

## How to check your work

Run the linter over what you wrote and drive its counts to the project's gate:

\`\`\`bash
specbase ste-lint <the files you wrote>
specbase ste-lint <files> --max <threshold>   # the gate; exit non-zero if over
\`\`\`

The report separates **errors** (banned words, marketing adjectives) from
**warnings** (long sentences, passives, em-dash slop). Fix the errors first,
then the warnings that matter. The gate counts \`total_per100w\`, so keep density
below the project's declared \`--max\` (the \`ops/ste\` pair states the glob and
threshold it gates today).

---

\`\`\`bash
# Reference the adopted tool by its contract locator, never restate it:
# the ste-lint command surface lives in behavior.cli.ste-lint.
\`\`\``;

const STE_WRITING_DESCRIPTION =
  'Write prose in Simplified Technical English: short active sentences, no marketing adjectives, no banned complex words. Apply whenever writing or revising READMEs, skill docs, generated agent docs, or CLI copy.';

/** The STE writing SKILL projection. Registered under the governed model. */
export function getSteWritingSkillTemplate(): SkillTemplate {
  return {
    name: 'specbase-ste-writing',
    description: STE_WRITING_DESCRIPTION,
    instructions: STE_WRITING_BODY,
    license: 'MIT',
    compatibility: 'Requires specbase CLI.',
    metadata: { author: 'specbase', version: '1.0' },
  };
}