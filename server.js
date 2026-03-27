import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'mongo-sanitize'
import routes from './routes/index.js'
import errorHandler from './middlewares/errorHandler.js'
import HttpError from './utils/httpError.js'

dotenv.config()

const app = express()
app.set('trust proxy', 1)

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}))

// CORS Configuration - restrict to frontend origin in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL || true)
    : true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

// Request logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Body parser with size limits
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// MongoDB injection prevention
app.use((req, res, next) => {
  if (req.body) {
    req.body = mongoSanitize(req.body)
  }
  if (req.query) {
    req.query = mongoSanitize(req.query)
  }
  if (req.params) {
    req.params = mongoSanitize(req.params)
  }
  next()
})

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 login requests per windowMs
  message: 'Too many login attempts, please try again later.',
  skip: (req, res) => process.env.NODE_ENV !== 'production',
  skipSuccessfulRequests: true,
})

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/', limiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)
app.use('/api', routes)

app.use((req, res, next) => {
  next(new HttpError(404, 'Route not found'))
})

app.use(errorHandler)

const start = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI
    const jwtSecret = process.env.JWT_SECRET

    if (!mongoURI) {
      throw new Error('MONGO_URI is required')
    }

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is required')
    }

    await mongoose.connect(mongoURI)
    console.log('Connected to the database...')

    // Start the server
    const PORT = process.env.PORT || 5000
    const server = app.listen(PORT, () =>
      console.log(`Server running at http://localhost:${PORT}...`)
    )

    const shutdown = async () => {
      console.log('Shutting down server...')
      server.close(async () => {
        await mongoose.connection.close()
        process.exit(0)
      })
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
  } catch (e) {
    console.error('Failed to start server:', e)
    process.exit(1)
  }
}

start()

export default app

