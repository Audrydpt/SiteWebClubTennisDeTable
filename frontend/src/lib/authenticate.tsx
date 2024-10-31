export type UserType = {
  user: string;
  privileges: 'Administrator' | 'Operator';
};

export class AuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function getCurrentUser(sessionId: string) {
  const response = await fetch(`${process.env.BACK_API_URL}/authenticate`, {
    headers: {
      Authorization: `X-Session-Id ${sessionId}`,
    },
  });

  if (!response.ok) throw new AuthError(response.status, response.statusText);

  return response.json() as Promise<UserType>;
}
