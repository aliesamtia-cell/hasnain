import nodemailer from "nodemailer";
import type { JobResult, PoolerightConfig } from "./types.js";

export async function sendBatchNotification(
  config: PoolerightConfig,
  results: JobResult[],
): Promise<void> {
  if (!config.notifyEmail || !config.smtp) return;

  const transport = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure ?? config.smtp.port === 465,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });

  const lines = results.map((r) => {
    if (!r.ok) return `- ${r.email}: FAILED — ${r.error}`;
    if (r.changePasswordAtNextLogin) {
      return `- ${r.email}: temp \`${r.password}\` (user changes at next login — same as Admin “Email password” + reset link flow)`;
    }
    return `- ${r.email}: final password \`${r.password}\``;
  });

  const body = [
    "Pooleright batch completed.",
    "",
    ...lines,
    "",
    "Delete this message after successful logins.",
  ].join("\n");

  await transport.sendMail({
    from: config.smtp.from,
    to: config.notifyEmail,
    subject: `[pooleright] ${results.filter((r) => r.ok).length}/${results.length} users processed`,
    text: body,
  });
}
