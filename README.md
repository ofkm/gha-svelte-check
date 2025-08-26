# Svelte Check Action

A Simple GitHub Action that runs `svelte-check` on the given directory.

## Usage Example

```yaml
- name: Run Svelte Check
  uses: ofkm/gha-svelte-check@latest
  with:
    working-directory: './src'
```

## Inputs

| Input               | Description                              | Required | Default |
| ------------------- | ---------------------------------------- | -------- | ------- |
| `working-directory` | Working directory to run svelte-check in | No       | `.`     |
| `fail-on-warnings`  | Fail the action if warnings are found    | No       | `false` |
| `fail-on-hints`     | Fail the action if hints are found       | No       | `false` |
| `tsconfig`          | Path to tsconfig file                    | No       | ``      |

## Outputs

| Output     | Description              |
| ---------- | ------------------------ |
| `errors`   | Number of errors found   |
| `warnings` | Number of warnings found |
| `hints`    | Number of hints found    |
