const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)

  if (err.details) {
    return res.status(err.statusCode || 400).json({
      error: err.message,
      details: err.details,
    })
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message)
    return res.status(400).json({ 
      error: 'Validation error', 
      details: errors 
    })
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0]
    return res.status(400).json({ 
      error: `${field} already exists` 
    })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' })
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' })
  }

  // Default error
  const statusCode = err.statusCode || 500
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message

  res.status(statusCode).json({ 
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  })
}

export default errorHandler
