const PREFIX = 'tiger-gram:';

export function saveLocal<T>(key: string, value: T): void {
  localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
}

export function loadLocal<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(`${PREFIX}${key}`);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
