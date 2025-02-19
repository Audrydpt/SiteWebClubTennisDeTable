interface DetailedError {
  message: string;
}

export default async function checkAIService(
  username: string = 'administrator',
  password: string = 'ACIC'
): Promise<{
  status: 'ok' | 'error';
  details?: DetailedError[];
}> {
  try {
    const response = await fetch(
      `${process.env.MAIN_API_URL}/health/aiServer/192.168.20.145`,
      {
        headers: {
          Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        },
      }
    );

    if (!response.ok) {
      return {
        status: 'error',
        details: [{ message: `AI Service returned status ${response.status}` }],
      };
    }

    const data = await response.json();
    if (data.status === 'error') {
      return {
        status: 'error',
        details: [{ message: data.message || 'AI Service is not responding' }],
      };
    }

    return { status: 'ok' };
  } catch (error) {
    return {
      status: 'error',
      details: [
        {
          message:
            error instanceof Error
              ? error.message
              : 'AI Service is unreachable',
        },
      ],
    };
  }
}
