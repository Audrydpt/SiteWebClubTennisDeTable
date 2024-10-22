export default async function GetUser(sessionId: string) {
  return fetch(`${process.env.BACK_API_URL}/authenticate`, {
    headers: {
      Authorization: `X-Session-Id ${sessionId}`,
    },
  }).then((res) => res.json());
}
