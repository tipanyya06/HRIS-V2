// Global error handler middleware
// Place this after all other middleware and routes
export const globalErrorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error({
    status,
    message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(status).json({
    error: {
      status,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
