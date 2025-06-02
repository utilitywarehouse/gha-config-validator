import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { parse as yamlParse } from "yaml";
import path from "node:path";

export type ConfigMap = {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    labels: {
      [key: string]: string;
    };
  };
  data: {
    [key: string]: string;
  };
};

export async function getConfigMaps(
  rootDir: string,
  paths: string[]
): Promise<ConfigMap[]> {
  return (await kustomizeBuildDirs(rootDir, paths))
    .trim()
    .split("---")
    .filter((s) => !!s)
    .map((s) => yamlParse(s.trim()))
    .filter((s) => s.kind === "ConfigMap")
    .filter(
      (s) =>
        !!s.metadata &&
        !!s.metadata.labels &&
        Object.keys(s.metadata.labels).length > 0 &&
        !!s.metadata.labels["uw.systems.validate"]
    )
    .map((s) => s as ConfigMap);
}

async function kustomizeBuildDirs(
  rootDir: string,
  paths: string[]
): Promise<string> {
  checkKustomize();
  console.debug("finding roots" + rootDir + paths);
  let kustomizationRoots = findKustomizationRoots(rootDir, paths)
    .filter((s) => existsSync(path.join(s, "kustomization.yaml")))
    .filter((s) => !checkIfIsComponent(path.join(s, "kustomization.yaml")));

  if (kustomizationRoots.length === 0) {
    return "";
  }

  console.debug("building manifests for roots" + kustomizationRoots);
  const builtManifests = await buildManifests(kustomizationRoots, rootDir);

  let result = "";

  for (const k in builtManifests) {
    result += "---\n" + builtManifests[k];
  }
  return result;
}

// findKustomizationRoots finds, for each given path, the first parent
// directory containing a 'kustomization.yaml'. It returns a list of such paths
// relative to the root
function findKustomizationRoots(root: string, paths: string[]): string[] {
  return [...new Set(paths.map((p) => findKustomizationRoot(root, p)))];
}

function findKustomizationRoot(repoRoot: string, relativePath: string): string {
  let dir = path.dirname(path.join(repoRoot, relativePath));
  while (dir != repoRoot) {
    console.log(`findKustomizationRoot. Enter loop. Current dir:  ${dir}`);

    if (existsSync(path.join(dir, "kustomization.yaml"))) {
      console.log(`found kustomization.yaml:  ${dir}`);
      return dir;
    }
    dir = path.resolve(path.dirname(dir));
    if (dir === "/") {
      break;
    }
  }

  return "";
}

function checkIfIsComponent(filepath: string): boolean {
  const file = readFileSync(filepath).toString();
  const kustomization = yamlParse(file);
  return kustomization.Kind == "Component";
}

function checkKustomize() {
  const output = spawnSync("kustomize", ["version"], {
    timeout: 5000,
    maxBuffer: 10 * 1024 * 1024,
  });

  if (output.status !== 0) {
    throw "Kustomize command failed due to: " + output.stderr.toString();
  }
}

async function buildManifests(
  kustomizationRoots: string[],
  rootDir: string
): Promise<{ [key: string]: string }> {
  const result = {};

  for (const k of kustomizationRoots) {
    const output = await kustomizeBuild(k);

    result[k] = output;
  }

  return result;
}

async function kustomizeBuild(path: string): Promise<string> {
  const proc = spawn("kustomize", ["build", path], { timeout: 5000 });

  const promise = new Promise<string>((resolve, reject) => {
    let result = "";
    let errors = "";
    proc.stdout.on("data", (data) => {
      result += data;
    });
    proc.stderr.on("data", (data) => {
      errors += data;
    });
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(
          `Kustomize build failed. path: ${path}. errors: ${errors}. Output: ${result}`
        );
      }
      resolve(result);
    });
  });

  return promise;
}
