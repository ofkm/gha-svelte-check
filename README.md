# Svelte Check Action

A GitHub Action that runs `svelte-check` with enhanced error reporting through problem matchers.

## Usage

```yaml
- name: Run Svelte Check
  uses: ofkm/gha-svelte-check@v1
  with:
    working-directory: './src'
    fail-on-warnings: true
    fail-on-hints: false
    tsconfig: './tsconfig.json'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `working-directory` | Working directory to run svelte-check in | No | `.` |
| `fail-on-warnings` | Fail the action if warnings are found | No | `false` |
| `fail-on-hints` | Fail the action if hints are found | No | `false` |
| `tsconfig` | Path to tsconfig file | No | `` |

## Outputs

| Output | Description |
|--------|-------------|
| `errors` | Number of errors found |
| `warnings` | Number of warnings found |
| `hints` | Number of hints found |