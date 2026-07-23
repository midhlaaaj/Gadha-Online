# Project Cloning & DB Export — Instructions for Claude Code

## 1. Clone the project locally (space-efficient copy)

Ask Claude Code to run an `rsync` copy of the "truth about" project, excluding heavy folders, into a new destination folder (e.g. `gadha-app/` or `lec-app/`).

**Prompt for Claude Code:**
> Copy the current project to a new folder called `<destination-name>` using rsync, excluding `node_modules`, `.git`, `.next`, `dist`, and `build` directories. Then run the install command inside the new folder to regenerate dependencies fresh.

Repeat this once per organization (Gadha, LEC) to get two independent working copies, without touching the original.

## 2. Export the full database (schema + data) as a reusable migration

Ask Claude Code to generate a complete, ordered database export so it can be re-run to recreate the DB from scratch for any future variation.

**Prompt for Claude Code:**
> List all existing migration files in order, then generate a single consolidated SQL script containing the full schema (all tables, indexes, constraints) plus a separate data dump of current content. Use `pg_dump`/`mysqldump` (whichever applies) with schema-only and data-only dumps kept as separate files, so I can choose to seed fresh or reuse content for each new org variation.

## Notes
- Do all rebranding/UI/feature removal work only in the copied folders — never in the original template.
- Keep the schema dump and data dump separate so future clones can start with an empty DB if needed.
