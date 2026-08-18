/**
 * Static template strings for PowerShell completion scripts.
 * These are PowerShell-specific helper functions that never change.
 */

export const POWERSHELL_DYNAMIC_HELPERS = `# Dynamic completion helpers

function Get-SpecbaseChanges {
    $output = specbase __complete changes 2>$null
    if ($output) {
        $output | ForEach-Object {
            ($_ -split "\\t")[0]
        }
    }
}

function Get-SpecbaseSpecs {
    $output = specbase __complete specs 2>$null
    if ($output) {
        $output | ForEach-Object {
            ($_ -split "\\t")[0]
        }
    }
}

function Get-SpecbaseStacks {
    $output = specbase __complete stacks 2>$null
    if ($output) { $output | ForEach-Object { ($_ -split "\\t")[0] } }
}

function Get-SpecbaseIdeas {
    $output = specbase __complete ideas 2>$null
    if ($output) { $output | ForEach-Object { ($_ -split "\\t")[0] } }
}

function Get-SpecbaseWorkItems {
    $output = specbase __complete work-items 2>$null
    if ($output) { $output | ForEach-Object { ($_ -split "\\t")[0] } }
}

function Get-SpecbaseSchemas {
    $output = specbase __complete schemas 2>$null
    if ($output) {
        $output | ForEach-Object {
            ($_ -split "\\t")[0]
        }
    }
}
`;
