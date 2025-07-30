// This function is safe to use on the client side
export function getCommitHash(): string {
  // On the client, we can only use the environment variable that was set at build time
  return process.env.NEXT_PUBLIC_COMMIT_HASH || "unknown";
}
