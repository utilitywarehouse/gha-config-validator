import path from "node:path";
import { Schema, Validator, ValidatorResult } from "jsonschema";
import { ConfigMap } from "./build";
import { parse as yamlParse } from "yaml";
import { readFileSync } from "node:fs";

export type ValidationResult = {
  name: string;
  result: ValidatorResult;
};

export function validateConfigMap(configMap: ConfigMap): ValidationResult[] {
  const v = new Validator();
  const schema = grabSchema(configMap.metadata.labels["uw.systems.validate"]);
  const results: ValidationResult[] = [];
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
    results.push({
      name: config,
      result: v.validate(parsedConfig, schema),
    });
  }
  return results;
}

function grabSchema(route: string): Schema {
  if (route.startsWith("http") || route.startsWith("ssh")) {
    //Not bothering at the moment
    return {};
  }

  const root = process.cwd();
  const pathToFile = path.join(root, route);

  return JSON.parse(readFileSync(pathToFile).toString());
}
