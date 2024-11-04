import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import routes from './routes/index.js'

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

const start = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI
    await mongoose.connect(mongoURI)
    console.log('Connected to the database...')

    // Routes
    app.use('/api', routes)

    // Start the server
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => 
      console.log(`Server running at http://localhost:${PORT}...`)
    )
  } catch (e) {
    console.error(e)
  }
}

start()

