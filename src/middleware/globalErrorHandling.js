export const globalErrorHandling = (err, req, res, next) => {
  const statusCode = err?.cause || 500;

  return res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    error: process.env.NODE_ENV === "development" ? err : undefined,
  });
};
