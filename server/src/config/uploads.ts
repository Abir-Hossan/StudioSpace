export const hostedUploadLimitMb = 4;
export const usesDatabaseUploads = () =>
  process.env.VERCEL === "1" || process.env.UPLOAD_STORAGE === "mongodb";

export const uploadLimitMb = () => usesDatabaseUploads() ? hostedUploadLimitMb : 10;
