import test from "tape";
import { validateConfigMap } from "./validate";
import { ConfigMap } from "./build";

type Test = {
  name: string;
  configMap: ConfigMap;
  expectedValid: boolean;
};

const tests: Test[] = [
  {
    name: "valid json configmap",
    configMap: {
      apiVersion: "v1",
      data: {
        "random.json": JSON.stringify({
          name: "some-name",
          id: "some-id",
          number: 1,
        }),
      },
      kind: "ConfigMap",
      metadata: {
        name: "random-68mg4k7kgg",
        namespace: "contact-channels",
        annotations: {
          "uw.systems.validate":
            "test-fixtures/kustomization-root-json/schema.json",
        },
      },
    },
    expectedValid: true,
  },
  {
    name: "valid yaml configmap",
    configMap: {
      apiVersion: "v1",
      data: {
        "random.yaml": `name: "some-name"
id: "some-id"
number: 1`,
      },
      kind: "ConfigMap",
      metadata: {
        name: "random-68mg4k7kgg",
        namespace: "contact-channels",
        annotations: {
          "uw.systems.validate":
            "test-fixtures/kustomization-root-json/schema.json",
        },
      },
    },
    expectedValid: true,
  },
  {
    name: "invalid configmap",
    configMap: {
      apiVersion: "v1",
      data: {
        "random.json": JSON.stringify({
          name: "some-name",
          id: "some-id",
        }),
      },
      kind: "ConfigMap",
      metadata: {
        name: "random-68mg4k7kgg",
        namespace: "contact-channels",
        annotations: {
          "uw.systems.validate":
            "test-fixtures/kustomization-root-json/schema.json",
        },
      },
    },
    expectedValid: false,
  },
];

test("validateConfigMap", (t) => {
  for (const test of tests) {
    t.test(test.name, (t) => {
      const results = validateConfigMap(test.configMap);
      t.equal(results.length, 1);
      t.equal(results[0].result.valid, test.expectedValid);
      t.end();
    });
  }
});
