type ApiError = Error & { status?: number };

export async function api<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let message = "Something went wrong on the pit wall.";
    try {
      const j = await res.json();
      if (j?.error) message = j.error;
    } catch {
      /* ignore */
    }
    const err = new Error(message) as ApiError;
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}
