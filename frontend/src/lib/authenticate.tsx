export enum UserPrivileges {
  Administrator = 'Administrator',
  Maintainer = 'Maintainer',
  Operator = 'Operator',
  Anonymous = 'Anonymous',
}
export type UserType = {
  user: string;
  privileges: UserPrivileges;
  password?: string;
};

export class AuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getSessionId(): string | undefined {
  const cookies = document.cookie.split(';').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  return cookies.SID;
}

export function setSessionId(sid: string): void {
  document.cookie = `SID=${sid}; path=/; Secure`;
}

export function removeSessionId(): void {
  document.cookie =
    'SID=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; Secure';
}

// Fonctions d'authentification
export async function getCurrentUser(sessionId: string): Promise<UserType> {
  const response = await fetch(`${process.env.BACK_API_URL}/authenticate`, {
    headers: {
      Authorization: `X-Session-Id ${sessionId}`,
    },
  });

  if (!response.ok) throw new AuthError(response.status, response.statusText);
  return response.json();
}

export async function loginUser(
  username: string,
  password: string
): Promise<string> {
  const response = await fetch(`${process.env.BACK_API_URL}/login`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    },
  });

  if (!response.ok) throw new AuthError(response.status, response.statusText);
  const data = await response.json();
  return data.SID;
}
