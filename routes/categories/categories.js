import { Router } from "express"
import { body, param, query } from "express-validator"
import Category from "../../models/Category.js"
import Product from "../../models/Product.js"
import authenticateToken from "../../middlewares/authentication.js"
import authorizeAdmin from "../../middlewares/authorization.js"
import asyncHandler from "../../utils/asyncHandler.js"
import HttpError from "../../utils/httpError.js"
import { buildPagination, handleValidationResult } from "../../utils/validation.js"

const router = Router()

const categoryValidation = [
  body('category_name').trim().isLength({ min: 2, max: 50 }).withMessage('Category name must be between 2 and 50 characters'),
  body('description').optional().trim().isLength({ max: 255 }).withMessage('Description cannot exceed 255 characters'),
]

router.get(
  "/",
  authenticateToken,
  [
    query('search').optional().trim(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  asyncHandler(async (req, res) => {
    handleValidationResult(req)

    const { search = '' } = req.query
    const { page, limit, skip } = buildPagination(req)
    const filter = search ? { category_name: { $regex: search, $options: 'i' } } : {}

    const [categories, total] = await Promise.all([
      Category.find(filter).sort({ category_name: 1 }).skip(skip).limit(limit),
      Category.countDocuments(filter),
    ])

    res.status(200).json({
      items: categories,
      pagination: { page, limit, total },
    })
  })
)

router.post("/", authenticateToken, authorizeAdmin, categoryValidation, asyncHandler(async (req, res) => {
  handleValidationResult(req)
  const category = new Category(req.body)
  await category.save()
  res.status(201).json(category)
}))

router.put("/:id", authenticateToken, authorizeAdmin, [param('id').isMongoId().withMessage('Invalid category id'), ...categoryValidation], asyncHandler(async (req, res) => {
  handleValidationResult(req)
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!category) {
    throw new HttpError(404, "Category not found")
  }
  res.status(200).json(category)
}))

router.delete("/:id", authenticateToken, authorizeAdmin, [param('id').isMongoId().withMessage('Invalid category id')], asyncHandler(async (req, res) => {
  handleValidationResult(req)

  const inUse = await Product.exists({ category: req.params.id })
  if (inUse) {
    throw new HttpError(409, 'Category cannot be deleted while products still reference it')
  }

  const category = await Category.findByIdAndDelete(req.params.id)
  if (!category) {
    throw new HttpError(404, "Category not found")
  }
  res.status(200).json({ message: "Category deleted successfully" })
}))

export default router
