const extractHttpStatusCode = (error) => {
  const statusCode = Number(error?.statusCode);

  if (Number.isInteger(statusCode) && statusCode >= 100 && statusCode <= 599) {
    return statusCode;
  }

  const message = typeof error?.message === 'string' ? error.message : '';
  const match = message.match(/\bHTTP\s*(\d{3})\b/i);

  if (!match) {
    return null;
  }

  return Number(match[1]);
};

export const formatErrorLine = (error) => {
  const statusCode = extractHttpStatusCode(error);
  return statusCode ? `HTTP error code: ${statusCode}` : 'HTTP error code: Network error or unknown error';
};
