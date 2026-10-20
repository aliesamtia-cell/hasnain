import pLimit from "p-limit";
import type { admin_directory_v1 } from "googleapis";
import type { JobResult, UserJob } from "./types.js";
import { reactivateUser } from "./workflow.js";

export async function runPool(
  directory: admin_directory_v1.Admin,
  jobs: UserJob[],
  defaults: Parameters<typeof reactivateUser>[2],
  concurrency: number,
): Promise<JobResult[]> {
  const limit = pLimit(Math.max(1, concurrency));
  return Promise.all(
    jobs.map((job) =>
      limit(() => reactivateUser(directory, job, defaults)),
    ),
  );
}
