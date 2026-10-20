export type PoolerightConfig = {
  /** Super admin email to impersonate (domain-wide delegation). */
  adminEmail: string;
  /** Path to GCP service account JSON key. */
  serviceAccountKeyPath: string;
  /** Where to send batch summary / per-user credentials (optional). */
  notifyEmail?: string;
  smtp?: {
    host: string;
    port: number;
    secure?: boolean;
    user: string;
    pass: string;
    from: string;
  };
  defaults?: {
    /** Force user to pick a new password on next sign-in (Admin console “Ask for change”). */
    changePasswordAtNextLogin?: boolean;
    turnOff2Sv?: boolean;
    signOut?: boolean;
    passwordLength?: number;
  };
};

export type UserJob = {
  email: string;
  /** If set, use this password instead of generating one. */
  password?: string;
  changePasswordAtNextLogin?: boolean;
  turnOff2Sv?: boolean;
  signOut?: boolean;
};

export type JobResult = {
  email: string;
  ok: boolean;
  password?: string;
  changePasswordAtNextLogin?: boolean;
  steps: string[];
  error?: string;
};
