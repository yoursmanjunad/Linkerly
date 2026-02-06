const rawApiBase =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const apiBaseUrl = rawApiBase.endsWith("/api")
  ? rawApiBase
  : `${rawApiBase}/api`;
