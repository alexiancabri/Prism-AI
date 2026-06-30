/** Client-side user preferences, persisted to localStorage and shared across
 *  the app via a tiny external store (so Settings and the chat stay in sync). */
export type Prefs = {
  displayName: string;
  animateAnswers: boolean;
  sendOnEnter: boolean;
  autoOpenSources: boolean;
  showSuggestions: boolean;
};

const KEY = "prism:prefs";

const defaults: Prefs = {
  displayName: "",
  animateAnswers: true,
  sendOnEnter: true,
  autoOpenSources: false,
  showSuggestions: true,
};

function read(): Prefs {
  if (typeof localStorage === "undefined") return defaults;
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return defaults;
  }
}

let state = read();
const subs = new Set<() => void>();

export function getPrefs(): Prefs {
  return state;
}

export function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  state = { ...state, [key]: value };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
  subs.forEach((f) => f());
}

export function subscribePrefs(cb: () => void) {
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
}
