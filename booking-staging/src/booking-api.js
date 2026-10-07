export async function requestApi(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    signal: options.signal || AbortSignal.timeout(15000),
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The server response was interrupted. Please retry.");
  }
  if (!response.ok)
    throw Object.assign(new Error(result.error || "The request failed."), {
      status: response.status,
      code: result.code,
    });
  return result;
}
