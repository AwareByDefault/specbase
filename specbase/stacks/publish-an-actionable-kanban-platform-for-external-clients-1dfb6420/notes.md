## Intent

Publish stable, headless Specbase lifecycle, board, and action contracts that external clients can consume without importing CLI or renderer internals. Preserve the standalone viewer while moving Pi rendering and RPIV execution into the separate pi-specbase integration.

## Stack boundary

This stack supersedes the unimplemented durable delivery-queue direction for new work. Specbase owns lifecycle truth, board snapshots, standalone columns, and action validation. It does not own Pi rendering, RPIV workflow definitions, Git delivery, or a durable agent queue.

## Cross-repository handoff

The companion stack in `../pi-specbase` consumes these public contracts. The two stacks remain repo-local and independently valid.
