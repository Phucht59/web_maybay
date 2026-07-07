const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const getApiOrigin = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

  if (!baseUrl) return "";

  try {
    return new URL(baseUrl).origin;
  } catch {
    return trimTrailingSlash(baseUrl).replace(/\/api$/i, "");
  }
};

export const getAssetUrl = (url) => {
  if (!url) return "";

  const value = String(url).trim();
  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }

  const apiOrigin = getApiOrigin();
  if (!apiOrigin) return value;

  return `${apiOrigin}${value.startsWith("/") ? value : `/${value}`}`;
};
