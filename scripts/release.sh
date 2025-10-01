#!/usr/bin/env bash
set -euo pipefail

if ! [ -f package.json ] || ! [ -f package-lock.json ]; then
  echo "Error: run this script from the repository root." >&2
  exit 1
fi

if ! command -v git-cliff >/dev/null 2>&1; then
  echo "Error: git-cliff is not installed. See https://git-cliff.org/docs/installation." >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is not installed. Install it and run 'gh auth login'." >&2
  exit 1
fi

export GIT_CLIFF_GITHUB_TOKEN=$(gh auth token)

if [ -n "$(git status --porcelain)" ]; then
  echo "Error: working tree is not clean. Commit or stash changes first." >&2
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "Error: releases must be created from the main branch (current: $CURRENT_BRANCH)." >&2
  exit 1
fi

git fetch --tags --quiet || true

CURRENT_VERSION=$(node -p "require('./package.json').version")

increment_version() {
  local version=$1
  local part=$2

  IFS='.' read -r -a parts <<<"$version"
  case "$part" in
    major)
      parts[0]=$((parts[0] + 1))
      parts[1]=0
      parts[2]=0
      ;;
    minor)
      parts[1]=$((parts[1] + 1))
      parts[2]=0
      ;;
    patch)
      parts[2]=$((parts[2] + 1))
      ;;
    *)
      echo "Unknown version part: $part" >&2
      exit 1
      ;;
  esac
  echo "${parts[0]}.${parts[1]}.${parts[2]}"
}

FORCED_TYPE=""
for arg in "$@"; do
  case "$arg" in
    --major) FORCED_TYPE="major" ;;
    --minor) FORCED_TYPE="minor" ;;
    --patch) FORCED_TYPE="patch" ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

LATEST_TAG=$(git describe --tags --abbrev=0 --match "v*" 2>/dev/null || true)

determine_release_type() {
  if [ -n "$FORCED_TYPE" ]; then
    echo "$FORCED_TYPE"
    return
  fi

  if [ -z "$LATEST_TAG" ]; then
    echo "minor"
    return
  fi

  local subjects
  subjects=$(git log --no-merges --format=%s "${LATEST_TAG}..HEAD")

  if echo "$subjects" | grep -Eiq '^feat(\([^)]+\))?: '; then
    echo "minor"
  elif echo "$subjects" | grep -Eiq '^(fix|perf)(\([^)]+\))?: '; then
    echo "patch"
  else
    echo ""
  fi
}

RELEASE_TYPE=$(determine_release_type)

if [ -z "$RELEASE_TYPE" ]; then
  echo "No release-worthy commits since ${LATEST_TAG:-start of history}. Nothing to do." >&2
  exit 0
fi

NEW_VERSION=$(increment_version "$CURRENT_VERSION" "$RELEASE_TYPE")
TAG="v$NEW_VERSION"

echo "Preparing $RELEASE_TYPE release: $TAG (current version $CURRENT_VERSION)"

npm version "$NEW_VERSION" --no-git-tag-version >/dev/null

echo "Running tests..."
npm test

echo "Building dist..."
npm run build

if ! git diff --quiet -- dist; then
  echo "dist/ updated for release."
fi

touch CHANGELOG.md
git cliff --config .git-cliff.toml --tag "$TAG" --unreleased --prepend CHANGELOG.md

git add package.json package-lock.json CHANGELOG.md dist

git commit -m "release: $NEW_VERSION"

git tag -a "$TAG" -m "Release $TAG"

MAJOR_TAG=$(echo "$TAG" | cut -d. -f1)

tmp_notes=$(mktemp)
trap 'rm -f "$tmp_notes"' EXIT

git cliff --config .git-cliff.toml --tag "$TAG" --unreleased > "$tmp_notes"

echo "Pushing changes..."
git push origin main
git push origin "$TAG"

echo "Updating major tag $MAJOR_TAG"
git tag -f "$MAJOR_TAG" "$TAG"
git push origin "$MAJOR_TAG" --force

echo "Creating GitHub release..."
gh release create "$TAG" --title "$TAG" --notes-file "$tmp_notes"

echo "Release $TAG created successfully."
