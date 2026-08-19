import { env } from "../config/env.js";

/**
 * Tells the public site to rebuild a page's static output.
 *
 * Best effort by design: content is already saved by the time this runs, so a
 * network hiccup here must never turn a successful save into an error. The
 * caller surfaces the boolean so the admin UI can warn that the live page may
 * lag behind.
 */
let warned = false;

export async function revalidatePage(slug: string): Promise<boolean> {
  if (!env.REVALIDATE_URL || !env.REVALIDATE_SECRET) {
    // Said once, not per request: a missing setting here used to look
    // identical to a successful no-op, which is how content ends up saved
    // and invisible with nothing in the logs to explain it.
    if (!warned) {
      warned = true;
      console.warn(
        "Revalidation is disabled: set REVALIDATE_URL and REVALIDATE_SECRET " +
          "to refresh the public site after a change.",
      );
    }
    return false;
  }

  try {
    const res = await fetch(env.REVALIDATE_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-revalidate-secret": env.REVALIDATE_SECRET,
      },
      body: JSON.stringify({ slug }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn(`Revalidate for "${slug}" returned ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`Revalidate for "${slug}" failed:`, err instanceof Error ? err.message : err);
    return false;
  }
}
