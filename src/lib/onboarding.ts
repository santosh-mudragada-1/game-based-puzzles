/** The setup route: username, the wait, and the three-screen explanation. */
export const WELCOME_PATH = "/welcome";

/** Where to hand the member back to once setup is finished. */
export const RETURN_KEY = "gbp:return-to";
/** Set when someone waved past setup to look around on the sample game. */
export const SKIP_KEY = "gbp:skipped";
/** The half-typed username, so a reload doesn't come back to an empty box. */
export const DRAFT_KEY = "gbp:draft-username";

/**
 * Session storage, but never throwing.
 *
 * Per-tab on purpose: none of this should outlive the visit, and private
 * browsing with storage denied should degrade to "asks again", not to a crash.
 */
export function read(key: string): string {
  try {
    return window.sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

export function write(key: string, value: string) {
  try {
    if (value) window.sessionStorage.setItem(key, value);
    else window.sessionStorage.removeItem(key);
  } catch {
    // Storage denied — the value simply isn't kept.
  }
}
