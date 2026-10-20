import { readFileSync } from "node:fs";
import type { PoolerightConfig, UserJob } from "./types.js";

export function loadConfig(path: string): PoolerightConfig {
  return JSON.parse(readFileSync(path, "utf8")) as PoolerightConfig;
}

export function loadUsersCsv(path: string): UserJob[] {
  const text = readFileSync(path, "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
  if (lines.length === 0) return [];

  const header = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
  const emailIdx = header.indexOf("email");
  if (emailIdx === -1) {
    return lines.map((line) => ({ email: line.split(",")[0]!.trim() }));
  }

  const passwordIdx = header.indexOf("password");
  const jobs: UserJob[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]!);
    const email = cols[emailIdx]?.trim();
    if (!email) continue;
    const job: UserJob = { email };
    if (passwordIdx >= 0 && cols[passwordIdx]?.trim()) {
      job.password = cols[passwordIdx]!.trim();
    }
    jobs.push(job);
  }
  return jobs;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

export function resolveDefaults(config: PoolerightConfig) {
  return {
    changePasswordAtNextLogin:
      config.defaults?.changePasswordAtNextLogin ?? true,
    turnOff2Sv: config.defaults?.turnOff2Sv ?? true,
    signOut: config.defaults?.signOut ?? true,
    passwordLength: config.defaults?.passwordLength ?? 16,
  };
}
