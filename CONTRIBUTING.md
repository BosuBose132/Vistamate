# Contributing to Vistamate

Thank you for considering contributing to **Vistamate**!  
This document describes our simple branch workflow: **main** and a temporary **release** branch.

## Branching Model

- **main**: The default branch. All development, features, and fixes are merged here.
- **release**: Temporary branch created from `main` when preparing a new release.

## Workflow

1. **Fork the repository** (optional, recommended for external contributors).
2. **Create a feature branch** from `main`:
   ```
   git checkout main
   git pull
   git checkout -b feature/your-feature-name
   ```
3. **Commit your changes** with clear messages.
4. **Push your branch** to your fork (or the main repo, if you have access).
5. **Open a Pull Request (PR) to `main`**:
   - All contributions should be merged into `main` via PR.
   - Make sure your PR is up to date with the latest `main` branch.

6. **Release Preparation**:
   - When ready for a new release, a maintainer will create a temporary `release` branch from `main`:
     ```
     git checkout main
     git pull
     git checkout -b release/vX.Y.Z
     ```
   - Final release tasks (version bump, changelog, docs, etc.) are completed in the `release` branch.

7. **Release Finalization**:
   - Merge the `release` branch back into `main`.
   - Optionally, tag the release:
     ```
     git tag vX.Y.Z
     git push --tags
     ```
   - Delete the `release` branch after merging.

## Default Branch

The **default branch** for this repository is `main`.  
Please base all your work and PRs on `main`.

## Additional Guidelines

- Follow the repository’s code style and conventions.
- Include relevant documentation and tests where applicable.
- Reference issues in your PR descriptions for traceability.

## Getting Help

If you have questions, open an issue or participate in discussions.

Happy coding and thank you for contributing!