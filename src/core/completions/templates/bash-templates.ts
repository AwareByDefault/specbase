/**
 * Static template strings for Bash completion scripts.
 * These are Bash-specific helper functions that never change.
 */

export const BASH_DYNAMIC_HELPERS = `# Dynamic completion helpers

_specbase_complete_changes() {
  local changes
  changes=$(specbase __complete changes 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$changes" -- "$cur"))
}

_specbase_complete_specs() {
  local specs
  specs=$(specbase __complete specs 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$specs" -- "$cur"))
}

_specbase_complete_items() {
  local items
  items=$(specbase __complete changes 2>/dev/null | cut -f1; specbase __complete specs 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$items" -- "$cur"))
}

_specbase_complete_schemas() {
  local schemas
  schemas=$(specbase __complete schemas 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$schemas" -- "$cur"))
}`;
