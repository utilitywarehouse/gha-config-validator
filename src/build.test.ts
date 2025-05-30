import fs from "node:fs";
import test from "tape";
import { ConfigMap, getConfigMaps } from "./build";

type Test = {
  name: string;
  files: string[];
  expected: ConfigMap[];
};

const tests: Test[] = [
  {
    name: "grabs all configmaps from file",
    files: ["test-fixtures/kustomization-root-json/schema.json"],
    expected: [
      {
        apiVersion: "v1",
        data: {
          "random.json": fs
            .readFileSync(
              "test-fixtures/kustomization-root-json/config/config.json"
            )
            .toString("utf-8"),
        },
        kind: "ConfigMap",
        metadata: {
          name: "random-68mg4k7kgg",
          namespace: "contact-channels",
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
          "random.yaml": fs
            .readFileSync("test-fixtures/mixed-configs/config/config.yaml")
            .toString("utf-8"),
        },
        kind: "ConfigMap",
        metadata: {
          name: "random-2h2chcckdm",
          namespace: "contact-channels",
          labels: {
            "uw.systems.validate":
              "test-fixtures/kustomization-root-json/schema.json",
          },
        },
      },
    ],
  },
];

test("getConfigMaps", (t) => {
  for (const test of tests) {
    t.test(test.name, async (t) => {
      const configMaps = await getConfigMaps(process.cwd(), [...test.files]);

      t.deepEqual(configMaps, test.expected);
      t.end();
    });
  }
});
