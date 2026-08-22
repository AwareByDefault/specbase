import type { ArchiveCard, ChangeCard, IdeaCard, KanbanStackContext, ViewBoardModel } from './model.js';
import type { LifecycleState } from '../work-item-lifecycle.js';
export type { LifecycleState } from '../work-item-lifecycle.js';

function progress(completed: number, total: number): string {
  return `${completed}/${total}`;
}

function stackContext(stack: KanbanStackContext | undefined): string {
  return stack ? ` | stack ${stack.id} ${stack.position}/${stack.total}` : '';
}

function ideaLine(card: IdeaCard): string {
  return `  ○ ${card.title} [${card.id}]${card.created ? ` created ${card.created}` : ''}${stackContext(card.stack)}`;
}

function changeLine(card: ChangeCard): string {
  return `  ◉ ${card.title} [${card.id}] artifacts ${progress(card.artifacts.completed, card.artifacts.total)} | tasks ${progress(card.tasks.completed, card.tasks.total)}${stackContext(card.stack)}`;
}

function archiveLine(card: ArchiveCard): string {
  return `  ✓ ${card.title} [${card.id}]${card.archived ? ` archived ${card.archived}` : ''} | tasks ${progress(card.tasks.completed, card.tasks.total)}${stackContext(card.stack)}`;
}

function section(title: string, lines: string[]): string[] {
  return [title, '─'.repeat(60), ...(lines.length ? lines : ['  (none)'])];
}

const LANE_LABELS: Record<LifecycleState, string> = {
  proposed: 'Proposed',
  enforcement: 'Enforcement',
  'ready-to-apply': 'Ready to Apply',
  implementing: 'Implementing',
  reviewing: 'Reviewing',
  archived: 'Archived',
};

const CHANGE_LANES: readonly Exclude<LifecycleState, 'archived'>[] = ['proposed', 'enforcement', 'ready-to-apply', 'implementing', 'reviewing'];

export function renderViewPlain(model: ViewBoardModel): string {
  const summary = model.summary;
  const laneCounts = CHANGE_LANES.map((lane) => `${LANE_LABELS[lane]}: ${summary.lanes[lane]}`).join(' | ');
  const lines = [
    'Specbase Lifecycle Board',
    `Project: ${model.project.name} • Snapshot • Read only`,
    '═'.repeat(60),
    'Summary',
    `  Open ideas: ${summary.openIdeas}`,
    `  Lane counts: ${laneCounts} | Archived: ${summary.lanes.archived}`,
    `  Active task progress: ${progress(summary.completedTasks, summary.totalTasks)}`,
    '',
    ...section('Open Ideas', model.lanes.ideas.map(ideaLine)),
    '',
    ...CHANGE_LANES.flatMap((lane) => [section(`${LANE_LABELS[lane]} (${summary.lanes[lane]})`, model.lanes[lane].map(changeLine)), '']),
    ...section('Archived', model.lanes.archived.map(archiveLine)),
  ];
  if (model.diagnostics.length) {
    lines.push('', ...section('Diagnostics', model.diagnostics.flatMap((item) => [
      `  ⚠ ${item.source}`,
      `    Problem: ${item.message}`,
      '    Consequence: This item may be missing or incomplete in the snapshot.',
      '    Next step: Run specbase validate, then use specbase view --plain for full project context.',
    ])));
  }
  lines.push('', 'Viewer only • no project files are changed');
  return `${lines.join('\n')}\n`;
}

export function renderViewJson(model: ViewBoardModel): string {
  return `${JSON.stringify(model, null, 2)}\n`;
}
