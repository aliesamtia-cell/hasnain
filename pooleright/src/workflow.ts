import type { admin_directory_v1 } from "googleapis";
import { generatePassword } from "./password.js";
import type { JobResult, UserJob } from "./types.js";

type Defaults = {
  changePasswordAtNextLogin: boolean;
  turnOff2Sv: boolean;
  signOut: boolean;
  passwordLength: number;
};

export async function reactivateUser(
  directory: admin_directory_v1.Admin,
  job: UserJob,
  defaults: Defaults,
): Promise<JobResult> {
  const email = job.email.trim().toLowerCase();
  const steps: string[] = [];
  const changePasswordAtNextLogin =
    job.changePasswordAtNextLogin ?? defaults.changePasswordAtNextLogin;
  const turnOff2Sv = job.turnOff2Sv ?? defaults.turnOff2Sv;
  const signOut = job.signOut ?? defaults.signOut;
  const password =
    job.password?.trim() || generatePassword(defaults.passwordLength);

  try {
    await directory.users.get({ userKey: email });
    steps.push("lookup_user");

    if (turnOff2Sv) {
      try {
        await directory.twoStepVerification.turnOff({ userKey: email });
        steps.push("turn_off_2sv");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (
          msg.includes("not enrolled") ||
          msg.includes("404") ||
          msg.includes("Cannot turn off")
        ) {
          steps.push("turn_off_2sv_skipped");
        } else {
          throw e;
        }
      }
    }

    await directory.users.patch({
      userKey: email,
      requestBody: {
        password,
        changePasswordAtNextLogin,
      },
    });
    steps.push("reset_password");

    if (signOut) {
      await directory.users.signOut({ userKey: email });
      steps.push("sign_out_sessions");
    }

    return {
      email,
      ok: true,
      password,
      changePasswordAtNextLogin,
      steps,
    };
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : String(e);
    return { email, ok: false, steps, error };
  }
}
