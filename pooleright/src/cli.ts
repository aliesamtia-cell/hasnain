#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import { createDirectoryClient } from "./auth.js";
import {
  loadConfig,
  loadUsersCsv,
  resolveDefaults,
} from "./config.js";
import { sendBatchNotification } from "./notify.js";
import { runPool } from "./pool.js";

const program = new Command();

program
  .name("pooleright")
  .description(
    "Automate Google Workspace user reactivation (2SV off, password reset, sign-out) via Admin SDK",
  )
  .option(
    "-c, --config <path>",
    "JSON config (adminEmail, serviceAccountKeyPath, defaults)",
    "config.json",
  )
  .option("-u, --users <path>", "CSV or newline list of user emails", "users.csv")
  .option(
    "-j, --concurrency <n>",
    "Parallel API calls",
    (v) => parseInt(v, 10),
    2,
  )
  .option(
    "--no-change-at-login",
    "Set final password; user does not need reset link email",
  )
  .option("--dry-run", "Print jobs only; no API calls")
  .action(async (opts) => {
    const config = loadConfig(opts.config as string);
    const jobs = loadUsersCsv(opts.users as string);
    if (jobs.length === 0) {
      console.error("No users found in", opts.users);
      process.exit(1);
    }

    const defaults = resolveDefaults(config);
    if (opts.changeAtLogin === false) {
      defaults.changePasswordAtNextLogin = false;
    }

    if (opts.dryRun) {
      console.log(JSON.stringify({ defaults, jobs }, null, 2));
      return;
    }

    const directory = createDirectoryClient(
      config.serviceAccountKeyPath,
      config.adminEmail,
    );

    console.log(
      `Processing ${jobs.length} user(s) as ${config.adminEmail} (concurrency ${opts.concurrency})…`,
    );

    const results = await runPool(
      directory,
      jobs,
      defaults,
      opts.concurrency as number,
    );

    const outDir = join(process.cwd(), "results");
    mkdirSync(outDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outPath = join(outDir, `batch-${stamp}.json`);
    writeFileSync(outPath, JSON.stringify(results, null, 2));

    for (const r of results) {
      if (r.ok) {
        const extra =
          r.changePasswordAtNextLogin
            ? "(change at next login)"
            : `password: ${r.password}`;
        console.log(`OK  ${r.email}  ${extra}  [${r.steps.join(", ")}]`);
      } else {
        console.error(`FAIL ${r.email}  ${r.error}`);
      }
    }

    await sendBatchNotification(config, results);
    console.log(`\nWrote ${outPath}`);
    const failed = results.filter((r) => !r.ok).length;
    process.exit(failed > 0 ? 1 : 0);
  });

program.parse();
