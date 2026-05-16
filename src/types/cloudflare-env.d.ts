/** Расширение env OpenNext на Workers (Hyperdrive binding из wrangler.jsonc). */
declare global {
  interface CloudflareEnv {
    HYPERDRIVE?: Hyperdrive
  }
}

export {}
