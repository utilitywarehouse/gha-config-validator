import { spawnSync } from "node:child_process";

export function gitDiff(mergeBase: string): string {
  const output = spawnSync(
    "git",
    ["diff", "--name-only", "--merge-base", mergeBase],
    {
      timeout: 5000,
      maxBuffer: 10 * 1024 * 1024,
    }
  );

  if (output.status !== 0) {
    throw "Git diff command failed due to: " + output.stderr.toString();
  }

  return output.stdout.toString();
}
