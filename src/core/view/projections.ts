import type { ArchiveCard, ChangeCard, IdeaCard, SpecCard, ViewBoardModel } from './model.js';

function progress(completed: number, total: number): string {
  return `${completed}/${total}`;
}

function ideaLine(card: IdeaCard): string {
  return `  ○ ${card.title} [${card.id}]${card.created ? ` created ${card.created}` : ''}`;
}

function changeLine(card: ChangeCard): string {
  return `  ◉ ${card.title} [${card.id}] artifacts ${progress(card.artifacts.completed, card.artifacts.total)} | tasks ${progress(card.tasks.completed, card.tasks.total)}`;
}

function archiveLine(card: ArchiveCard): string {
  return `  ✓ ${card.title} [${card.id}]${card.archived ? ` archived ${card.archived}` : ''} | tasks ${progress(card.tasks.completed, card.tasks.total)}`;
}

function specLine(card: SpecCard): string {
  const diag = card.diagnostic ? ` ⚠ ${card.diagnostic.length > 50 ? card.diagnostic.slice(0, 50) + '…' : card.diagnostic}` : '';
  return `  ▪ ${card.locator} [${card.id}] ${card.requirementCount} requirement${card.requirementCount === 1 ? '' : 's'}${diag}`;
}

function section(title: string, lines: string[]): string[] {
  return [title, '─'.repeat(60), ...(lines.length ? lines : ['  (none)'])];
}

export function renderViewPlain(model: ViewBoardModel): string {
  const summary = model.summary;
  const lines = [
    'Specbase Lifecycle Board',
    '═'.repeat(60),
    'Summary',
    `  Specifications: ${summary.acceptedSpecs} | Requirements: ${summary.requirements}`,
    `  Open ideas: ${summary.openIdeas} | Active changes: ${summary.activeChanges} | Archives: ${summary.archivedChanges}`,
    `  Active task progress: ${progress(summary.completedTasks, summary.totalTasks)}`,
    '',
    ...section('Open Ideas', model.columns.ideas.map(ideaLine)),
    '',
    ...section('Active Changes', model.columns.changes.map(changeLine)),
    '',
    ...section('Archived Changes', model.columns.archives.map(archiveLine)),
    '',
    ...section('Specifications', model.specs.map(specLine)),
  ];
  if (model.diagnostics.length) {
    lines.push('', ...section('Diagnostics', model.diagnostics.map((item) => `  ⚠ ${item.source}: ${item.message}`)));
  }
  lines.push('', 'Viewer only • no project files are changed');
  return `${lines.join('\n')}\n`;
}

export function renderViewJson(model: ViewBoardModel): string {
  return `${JSON.stringify(model, null, 2)}\n`;
}
