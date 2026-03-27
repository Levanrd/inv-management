import dotenv from 'dotenv'
import mongoose from 'mongoose'
import User from '../models/User.js'

dotenv.config()

const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin1234'
const testUserPassword = process.env.SEED_TEST_PASSWORD || 'TestUser1234'

const seededUsers = [
  {
    user_name: 'admin',
    first_name: 'System',
    last_name: 'Administrator',
    email: 'admin@example.com',
    password: adminPassword,
    role: 'admin',
  },
  {
    user_name: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    email: 'testuser@example.com',
    password: testUserPassword,
    role: 'user',
  },
]

const resetDatabase = async () => {
  const mongoUri = process.env.MONGO_URI

  if (!mongoUri) {
    throw new Error('MONGO_URI is required to reset the database')
  }

  await mongoose.connect(mongoUri)

  try {
    console.log('Connected to MongoDB')
    console.log('Dropping database...')
    await mongoose.connection.dropDatabase()

    console.log('Seeding users...')
    const createdUsers = []

    for (const user of seededUsers) {
      const createdUser = new User(user)
      await createdUser.save()
      createdUsers.push(createdUser)
    }

    await User.syncIndexes()

    console.log('Database reset complete.')
    console.log('Seeded accounts:')

    createdUsers.forEach((user) => {
      const password = user.role === 'admin' ? adminPassword : testUserPassword
      console.log(`- ${user.role}: ${user.email} / ${password}`)
    })
  } finally {
    await mongoose.disconnect()
  }
}

resetDatabase().catch((error) => {
  console.error('Failed to reset database:', error)
  process.exit(1)
})
