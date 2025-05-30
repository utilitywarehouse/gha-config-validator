import github from "@actions/core";
import { Schema, Validator } from "jsonschema";
import path from "node:path";
import { gitDiff } from "./git";
import { getConfigMaps } from "./build";
import { parse as yamlParse } from "yaml";

(async function run() {
  // The ref to compare against. This is usually "master" or whatever branch a PR is set to merge into.
  const mergeBase = github.getInput("merge-base");

  const diff = gitDiff(mergeBase);
  const configMaps = await getConfigMaps(process.cwd(), diff.split("\n"));

  const v = new Validator();

  let shouldFail = false;

  for (const configMap of configMaps) {
    const schema = grabSchema(configMap.metadata.labels["uw.systems.validate"]);
    for (const config in configMap.data) {
      let parsedConfig;
      switch (path.extname(config)) {
        case ".json":
          parsedConfig = JSON.parse(configMap.data[config]);
          break;
        case ".yaml":
        case ".yml":
          parsedConfig = yamlParse(configMap.data[config]);
          break;
      }
      const result = v.validate(parsedConfig, schema);
      if (!result.valid) {
        github.error(
          `The configmap "${
            configMap.metadata.name
          }" does not validate against the schema: ${JSON.stringify(
            result.errors
          )}`,
          { title: "Schema validation failed" }
        );
        shouldFail = true;
      }
    }
  }

  if (shouldFail) {
    github.setFailed("Check failed");
  }
})();

function grabSchema(route: string): Schema {
  if (route.startsWith("http") || route.startsWith("ssh")) {
    //Not bothering at the moment
    return {};
  }

  const root = process.cwd();
  const pathToFile = path.join(root, route);

  return require(pathToFile);
}
