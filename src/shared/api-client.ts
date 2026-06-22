export function authHeaders(token: string): Record<string, string> {
  const hdrs: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) hdrs['Authorization'] = 'Bearer ' + token;
  return hdrs;
}
