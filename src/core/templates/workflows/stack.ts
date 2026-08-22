import type { CommandTemplate, SkillTemplate } from '../types.js';
import { STORE_SELECTION_GUIDANCE } from './store-selection.js';
import type { SpecModel } from '../../artifact-graph/types.js';
import { withGovernedGuidance, GOVERNED_AUTHORING_GUIDANCE } from './governed-guidance.js';

const STACK_WORKFLOW = `Decompose a large idea into a finite linear change stack of independently observable vertical slices.

${STORE_SELECTION_GUIDANCE}

**Input**: An open idea ID. Read its CLI-resolved scratchpad before proposing members.

Resolve one root flag before acting: use no extra flag for repo-local work, or use \`--store "<id>"\` on **every** command below for a registered store. Never mix roots while decomposing one stack.

**Steps**

1. Run \`specbase ideas show "<idea-id>" --json [--store "<id>"]\` and read the reported notes and supporting files.
2. Propose the smallest finite sequence of ordinary work items that delivers the intent incrementally.
3. Apply the **vertical-slice test** to every candidate:
   - name the real user or agent entry point through which it is demonstrable;
   - state the outcome that becomes newly true at this boundary;
   - ensure the member is understandable and reviewable without future members;
   - leave specs, evidence, and repository state coherent at every prefix;
   - name explicit deferrals to later members.
4. Challenge horizontal phases. A list such as setup → internal layer → UI is not a stack unless each boundary exposes an observable outcome. Reshape horizontal phases into end-to-end slices before continuing.
5. After the user accepts the decomposition, create each slice as an ordinary child idea with \`specbase ideas add --title ... --json [--store "<id>"]\`. Each member keeps its own stable identity, artifacts, tasks, validation, review, and archive lifecycle. Do not create one giant final spec split into implementation batches.
6. Create the stack through the CLI, never by writing its manifest directly:
   \`specbase stack create --from-idea "<idea-id>" --summary "<summary>" --member "<first-id>" --member "<second-id>" ... --json [--store "<id>"]\`
7. Run \`specbase stack validate "<idea-id>" --json [--store "<id>"]\` and report the ordered members, newly observable outcome, explicit deferrals, and first unfinished member.

Stacks are repo-local linear delivery context, not tasks or retired initiatives. Do not add DAG edges, nesting, cross-repository targets, Git branches, PRs, worktrees, assignees, or Kanban state.`;

export function getStackSkillTemplate(specModel?: SpecModel): SkillTemplate {
  return {
    name: 'specbase-stack',
    description: 'Decompose a large idea into independently observable vertical delivery slices and create a repo-local linear change stack.',
    instructions: withGovernedGuidance(STACK_WORKFLOW, specModel, GOVERNED_AUTHORING_GUIDANCE),
    license: 'MIT', compatibility: 'Requires specbase CLI.', metadata: { author: 'specbase', version: '1.0' },
  };
}

export function getSpcbStackCommandTemplate(specModel?: SpecModel): CommandTemplate {
  return {
    name: 'SPCB: Stack',
    description: 'Decompose an idea into a finite linear stack of vertical delivery slices',
    category: 'Workflow', tags: ['workflow', 'stack', 'vertical-slices'], content: withGovernedGuidance(STACK_WORKFLOW, specModel, GOVERNED_AUTHORING_GUIDANCE),
  };
}
