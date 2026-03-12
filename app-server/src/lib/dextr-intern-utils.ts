const DEXTR_INTERN_BASE_URL = 'https://dextr-intern.onrender.com';

function getAuthToken(): string {
  const token = process.env.DEXTR_INTERN_AUTH_TOKEN;
  if (!token) {
    throw new Error('DEXTR_INTERN_AUTH_TOKEN is not set');
  }
  return token;
}

export async function dextrInternFetch(path: string): Promise<Response> {
  const token = getAuthToken();
  const url = `${DEXTR_INTERN_BASE_URL}${path}`;
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

export async function dextrInternPost(
  path: string,
  body: Record<string, string>,
): Promise<Response> {
  const token = getAuthToken();
  const url = `${DEXTR_INTERN_BASE_URL}${path}`;
  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}
