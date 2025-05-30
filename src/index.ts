import github from "@actions/core";
import { Validator } from "jsonschema";
import { gitDiff } from "./git";
import { getConfigMaps } from "./build";
import { validateConfigMap } from "./validate";

(async function run() {
  // The ref to compare against. This is usually "master" or whatever branch a PR is set to merge into.
  const mergeBase = github.getInput("merge-base");

  const diff = gitDiff(mergeBase);
  const configMaps = await getConfigMaps(process.cwd(), diff.split("\n"));

  const v = new Validator();

  let shouldFail = false;

  for (const configMap of configMaps) {
    validateConfigMap(configMap).forEach((result) => {
      if (!result.result.valid) {
        github.error(
          `The configmap "${
            configMap.metadata.name
          }" does not validate against the schema: ${JSON.stringify(
            result.result.errors
          )}`,
          { title: "Schema validation failed" }
        );
        shouldFail = true;
      }
    });
  }

  if (shouldFail) {
    github.setFailed("Check failed");
  }
})();
