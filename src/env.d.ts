interface ImportMetaEnv {
  /** Set to "off" at build time to disable crash reports (e.g. for the self-hosted Business edition). */
  readonly PUBLIC_ERROR_REPORTING?: string;
  /** Set to "off" at build time to drop the free-tier daily limit, which needs our backend
   * (the self-hosted Business edition runs with no internet access and is licensed per company). */
  readonly PUBLIC_USAGE_LIMITS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
