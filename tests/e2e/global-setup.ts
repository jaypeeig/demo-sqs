import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ROOT = fileURLToPath(new URL("../../", import.meta.url));

const HEALTH_TIMEOUT_MS = 15_000;
const HEALTH_POLL_INTERVAL_MS = 250;

// Extra probe on top of `docker compose up --wait` in case the network is slow to route.
async function waitUntilReachable(): Promise<void> {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      await fetch("http://localhost:9324");
      return;
    } catch {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, HEALTH_POLL_INTERVAL_MS);
      });
    }
  }
  throw new Error(
    `ElasticMQ was not reachable on http://localhost:9324 within ${HEALTH_TIMEOUT_MS}ms`,
  );
}

export async function setup(): Promise<void> {
  await execFileAsync("docker", ["compose", "up", "-d", "--wait"], { cwd: ROOT });
  await waitUntilReachable();
}

export async function teardown(): Promise<void> {
  if (process.env.KEEP_SQS === "1") return;
  await execFileAsync("docker", ["compose", "down"], { cwd: ROOT });
}
