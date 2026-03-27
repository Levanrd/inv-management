import { Schema, model } from "mongoose"
import bcrypt from "bcrypt"

const user = new Schema({
  user_name: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [50, 'Username cannot be more than 50 characters']
  },
  first_name: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  last_name: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: [100, 'Email cannot be more than 100 characters'],
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't return password by default in queries
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
}, { 
  timestamps: true
})

// Hash password before saving
user.pre('save', async function(next) {
  if(!this.isModified('password')) return next()

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

user.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate()

  if (!update?.password) {
    next()
    return
  }

  const salt = await bcrypt.genSalt(10)
  update.password = await bcrypt.hash(update.password, salt)
  this.setUpdate(update)
  next()
})

// Compare password
user.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password)
}

export default model('User', user)
