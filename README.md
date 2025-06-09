# gha-config-validator

This is a github action meant to ease config validation on CI. It will validate any yaml or json configuration files that are marked with the `uw.systems.validate` label. The value of the label must be the path to the jsonschema that should be run against the configuration. To do so from a kustomization file you would need to add the following:

```yaml
configMapGenerator:
  - name: a-configuration-file
    options:
      annotations:
        uw.systems.validate: "path/from/repo/root/schema.json"
    files:
      - config.yaml=./config.yaml
```

## Usage

```yaml
name: Validate YAML Schema
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          # Need all history for the action to calculate the diff.
          fetch-depth: 0
      - name: Validate
        uses: utilitywarehouse/gha-config-validator@v0.1.5
        with:
          merge-base: origin/main
```
