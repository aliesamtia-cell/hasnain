import { readFileSync } from "node:fs";
import { google } from "googleapis";

const DIRECTORY_SCOPES = [
  "https://www.googleapis.com/auth/admin.directory.user",
  "https://www.googleapis.com/auth/admin.directory.user.security",
];

export function createDirectoryClient(
  serviceAccountKeyPath: string,
  adminEmail: string,
) {
  const key = JSON.parse(readFileSync(serviceAccountKeyPath, "utf8")) as {
    client_email: string;
    private_key: string;
  };

  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: DIRECTORY_SCOPES,
    subject: adminEmail,
  });

  return google.admin({ version: "directory_v1", auth });
}
