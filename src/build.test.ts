import fs from "node:fs";
import test from "tape";
import { ConfigMap, getConfigMaps } from "./build";

type Test = {
  name: string;
  files: string[];
  expected: ConfigMap[];
};

const tests = [
  {
    name: "grabs all configmaps from file",
    files: ["test-fixtures/kustomization-root-json/schema.json"],
    expected: [
      {
        apiVersion: "v1",
        data: {
          "config.json": fs
            .readFileSync(
              "test-fixtures/kustomization-root-json/config/config.json"
            )
            .toString("utf-8"),
        },
        kind: "ConfigMap",
        metadata: {
          name: "random",
          labels: {
            "uw.systems.validate":
              "test-fixtures/kustomization-root-json/schema.json",
          },
        },
      },
    ],
  },
  {
    name: "only grabs all configmap with annotation",
    files: ["test-fixtures/mixed-configs/config/config.json"],
    expected: [
      {
        apiVersion: "v1",
        data: {
          "config.yaml": fs
            .readFileSync("test-fixtures/mixed-configs/config/config.yaml")
            .toString("utf-8"),
        },
        kind: "ConfigMap",
        metadata: {
          name: "random",
          labels: {
            "uw.systems.validate":
              "test-fixtures/kustomization-root-json/schema.json",
          },
        },
      },
    ],
  },
];

test("getConfigMaps", async (t) => {
  for (const test of tests) {
    t.test(test.name, async (t) => {
      const configMaps = await getConfigMaps(process.cwd(), [...test.files]);
      t.deepEqual(configMaps, test.expected);
      t.end();
    });
  }
});
