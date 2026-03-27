import { Router } from "express"
import { body, param, query } from "express-validator"
import User from "../../models/User.js"
import authenticateToken from "../../middlewares/authentication.js"
import authorizeAdmin from "../../middlewares/authorization.js"
import asyncHandler from "../../utils/asyncHandler.js"
import HttpError from "../../utils/httpError.js"
import { sanitizeUser } from "../../utils/serializers.js"
import { buildPagination, handleValidationResult } from "../../utils/validation.js"

const router = Router()

const userUpdateValidation = [
  param('id').isMongoId().withMessage('Invalid user id'),
  body('user_name').optional().trim().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
  body('first_name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name must be between 1 and 50 characters'),
  body('last_name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be between 1 and 50 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
]

router.get(
  '/',
  authenticateToken,
  authorizeAdmin,
  [
    query('search').optional().trim(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  asyncHandler(async (req, res) => {
    handleValidationResult(req)

    const { search = '' } = req.query
    const { page, limit, skip } = buildPagination(req)

    const filter = search
      ? {
          $or: [
            { user_name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { first_name: { $regex: search, $options: 'i' } },
            { last_name: { $regex: search, $options: 'i' } },
          ],
        }
      : {}

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ])

    res.status(200).json({
      items: users.map(sanitizeUser),
      pagination: { page, limit, total },
    })
  })
)

router.get('/:id', authenticateToken, userUpdateValidation.slice(0, 1), asyncHandler(async (req, res) => {
  handleValidationResult(req)

  if (req.user._id !== req.params.id && req.user.role !== "admin") {
    throw new HttpError(403, "Forbidden to perform this task")
  }

  const user = await User.findById(req.params.id)
  if (!user) {
    throw new HttpError(404, 'User not found')
  }

  res.status(200).json(sanitizeUser(user))
}))

router.post(
  '/',
  authenticateToken,
  authorizeAdmin,
  [
    body('user_name').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
    body('first_name').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required'),
    body('last_name').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('role').isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  ],
  asyncHandler(async (req, res) => {
    handleValidationResult(req)

    const existingUser = await User.findOne({
      $or: [{ email: req.body.email }, { user_name: req.body.user_name }],
    })

    if (existingUser) {
      throw new HttpError(409, 'Email or username already exists')
    }

    const user = new User(req.body)
    await user.save()
    res.status(201).json({ message: 'User added successfully', user: sanitizeUser(user) })
  })
)

router.put('/:id', authenticateToken, userUpdateValidation, asyncHandler(async (req, res) => {
  handleValidationResult(req)

  if (req.user._id !== req.params.id && req.user.role !== "admin") {
    throw new HttpError(403, "Forbidden to perform this task")
  }

  if (req.body.role && req.user.role !== 'admin') {
    throw new HttpError(403, 'Only admins can change roles')
  }

  const allowedFields = ['user_name', 'first_name', 'last_name', 'email', 'password', 'role']
  const payload = Object.fromEntries(
    Object.entries(req.body).filter(([key, value]) => allowedFields.includes(key) && value !== undefined)
  )

  const user = await User.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  })

  if (!user) {
    throw new HttpError(404, 'User not found')
  }

  res.status(200).json(sanitizeUser(user))
}))

router.delete('/:id', authenticateToken, [param('id').isMongoId().withMessage('Invalid user id')], asyncHandler(async (req, res) => {
  handleValidationResult(req)

  if (req.user._id !== req.params.id && req.user.role !== 'admin') {
    throw new HttpError(403, 'Forbidden to perform this task')
  }

  const user = await User.findByIdAndDelete(req.params.id)
  if (!user) {
    throw new HttpError(404, 'User not found')
  }

  res.status(200).json({ message: 'User deleted successfully' })
}))

export default router
