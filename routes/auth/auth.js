import { Router } from "express"
import { body } from "express-validator"
import jwt from "jsonwebtoken"
import User from "../../models/User.js"
import authenticateToken from "../../middlewares/authentication.js"
import authorizeAdmin from "../../middlewares/authorization.js"
import asyncHandler from "../../utils/asyncHandler.js"
import HttpError from "../../utils/httpError.js"
import { sanitizeUser } from "../../utils/serializers.js"
import { handleValidationResult } from "../../utils/validation.js"

const router = Router()

function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' })
}

const validateRegister = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('user_name').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
  body('first_name').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required'),
  body('last_name').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required'),
]

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
]

router.post('/register', validateRegister, asyncHandler(async (req, res) => {
  handleValidationResult(req)

  const { user_name, first_name, last_name, email, password } = req.body

  const existingUser = await User.findOne({ $or: [{ email }, { user_name }] })
  if (existingUser) {
    throw new HttpError(
      409,
      existingUser.email === email ? 'Email already registered' : 'Username already taken'
    )
  }

  const user = new User({ user_name, first_name, last_name, email, password, role: 'user' })
  await user.save()

  res.status(201).json({
    message: 'User registered successfully',
    user: sanitizeUser(user),
  })
}))

router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  handleValidationResult(req)

  const { email, password } = req.body
  const user = await User.findOne({ email }).select('+password')

  if (!user) {
    throw new HttpError(401, 'Incorrect email or password')
  }

  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    throw new HttpError(401, 'Incorrect email or password')
  }

  const token = generateToken({
    _id: user._id,
    email: user.email,
    user_name: user.user_name,
    role: user.role,
  })

  res.status(200).json({
    token,
    user_name: user.user_name,
    role: user.role,
    expiresIn: '24h',
  })
}))

router.post(
  '/register-admin',
  authenticateToken,
  authorizeAdmin,
  validateRegister,
  asyncHandler(async (req, res) => {
    handleValidationResult(req)

    const { user_name, first_name, last_name, email, password } = req.body

    const existingUser = await User.findOne({ $or: [{ email }, { user_name }] })
    if (existingUser) {
      throw new HttpError(
        409,
        existingUser.email === email ? 'Email already registered' : 'Username already taken'
      )
    }

    const user = new User({ user_name, first_name, last_name, email, password, role: 'admin' })
    await user.save()

    res.status(201).json({
      message: 'Admin user registered successfully',
      user: sanitizeUser(user),
    })
  })
)

router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (!user) {
    throw new HttpError(404, 'User not found')
  }

  res.status(200).json(sanitizeUser(user))
}))

router.post('/logout', (req, res) => {
  res.status(200).json({ message: 'User logged out successfully' })
})

export default router
