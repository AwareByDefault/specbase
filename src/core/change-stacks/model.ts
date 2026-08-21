import { z } from 'zod';
import { isKebabId } from '../id.js';

export const STACKS_DIRNAME = 'stacks';
export const STACK_MANIFEST_FILENAME = '.openspec.yaml';
export const STACK_NOTES_FILENAME = 'notes.md';

const stableId = z.string().superRefine((value, ctx) => {
  if (!isKebabId(value)) {
    ctx.addIssue({
      code: 'custom',
      message: 'must be a stable kebab-case ID, not a path or external reference',
    });
  }
});

export const StackManifestSchema = z.object({
  id: stableId,
  summary: z.string().trim().min(1),
  created: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'created must be YYYY-MM-DD'),
  members: z.array(stableId).min(2, 'a stack requires at least two members'),
}).strict().superRefine((value, ctx) => {
  const seen = new Set<string>();
  value.members.forEach((member, index) => {
    if (seen.has(member)) {
      ctx.addIssue({
        code: 'custom',
        path: ['members', index],
        message: `duplicate member '${member}'`,
      });
    }
    seen.add(member);
  });
});

export type StackManifest = z.infer<typeof StackManifestSchema>;
export type StackMemberPosition = 'idea' | 'change' | 'archived';

export interface ResolvedStackMember {
  id: string;
  position: StackMemberPosition;
  dir: string;
  directoryName: string;
}

export interface StackDiagnostic {
  severity: 'error';
  code:
    | 'invalid_stack_manifest'
    | 'stack_not_found'
    | 'missing_member'
    | 'ambiguous_member'
    | 'malformed_member_metadata'
    | 'nested_stack'
    | 'multiple_stack_membership';
  message: string;
  member?: string;
  path?: string;
  fix?: string;
}

export class StackValidationError extends Error {
  public readonly diagnostic: StackDiagnostic;

  constructor(public readonly diagnostics: StackDiagnostic[]) {
    super(diagnostics.map((diagnostic) => diagnostic.message).join('; '));
    this.name = 'StackValidationError';
    this.diagnostic = diagnostics[0];
  }
}
