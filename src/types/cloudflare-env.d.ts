/** Расширение env OpenNext на Workers. */
declare global {
  interface CloudflareEnv {
    DB?: D1Database
  }
}

export {}
