/**
 * Middleware para manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  const response = {
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      path: req.path
    })
  };

  res.json(response);
};

module.exports = errorHandler;