# Contributing to DriveBook

This guide explains how Don should work on DriveBook when switching between a laptop and desktop.

## Core Rule

GitHub is the source of truth for the project.

Always sync with GitHub before starting work, and always push your latest work before switching machines.

The external drive is for backups only. Do not use it as the active working copy or the main way to move code between machines.

## Daily Workflow

1. Before starting work, pull the latest changes from GitHub.
2. Create a feature branch for the work.
3. Make small, focused changes.
4. Commit changes in small, understandable chunks.
5. Push the branch to GitHub before switching machines.
6. On the other machine, pull from GitHub before continuing.

## Do Not Work Directly on Main

Never make feature changes directly on `main`.

Use `main` only as the clean, shared baseline. New work should happen on feature branches.

## Basic Commands

Pull the latest changes:

```bash
git pull origin main
```

Create and switch to a feature branch:

```bash
git checkout -b feature/instructor-profile
```

Check what changed:

```bash
git status
```

Stage files:

```bash
git add .
```

Commit a small change:

```bash
git commit -m "Add instructor profile form"
```

Push the branch to GitHub:

```bash
git push origin feature/instructor-profile
```

Switch back to `main`:

```bash
git checkout main
```

Update `main` before starting the next feature:

```bash
git pull origin main
```

## Switching Machines

Before leaving one machine:

```bash
git status
git add .
git commit -m "Save current progress"
git push origin your-branch-name
```

On the other machine:

```bash
git checkout main
git pull origin main
git checkout your-branch-name
git pull origin your-branch-name
```

## Good Commit Habits

- Commit small changes.
- Use clear commit messages.
- Push before switching machines.
- Pull before starting work.
- Keep unfinished experiments on a feature branch, not `main`.

## Backup Rule

The external drive can be used for extra backups, but GitHub remains the source of truth.

If there is ever a difference between GitHub and an external drive backup, trust GitHub first.
