export interface ApiExecutionInput {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface ApiExecutionResult {
  ok: boolean;
  status: number;
  bodyText: string;
}

export async function runApiExecution(input: ApiExecutionInput): Promise<ApiExecutionResult> {
  const response = await fetch(input.url, {
    method: input.method,
    headers: input.headers,
    body: input.body
  });

  const bodyText = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    bodyText
  };
}
