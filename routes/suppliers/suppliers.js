import { Router } from "express"
import { body, param, query } from "express-validator"
import Supplier from "../../models/Supplier.js"
import Product from "../../models/Product.js"
import authenticateToken from "../../middlewares/authentication.js"
import authorizeAdmin from "../../middlewares/authorization.js"
import asyncHandler from "../../utils/asyncHandler.js"
import HttpError from "../../utils/httpError.js"
import { buildPagination, handleValidationResult } from "../../utils/validation.js"

const router = Router()

const supplierValidation = [
  body('supplier_name').trim().isLength({ min: 2, max: 50 }).withMessage('Supplier name must be between 2 and 50 characters'),
  body('contact_info.address').trim().isLength({ min: 5, max: 255 }).withMessage('Address must be between 5 and 255 characters'),
  body('contact_info.phone').trim().isLength({ min: 7, max: 15 }).withMessage('Phone number must be between 7 and 15 characters'),
  body('contact_info.email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
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
    const filter = search ? { supplier_name: { $regex: search, $options: 'i' } } : {}

    const [items, total] = await Promise.all([
      Supplier.find(filter).sort({ supplier_name: 1 }).skip(skip).limit(limit),
      Supplier.countDocuments(filter),
    ])

    res.status(200).json({
      items,
      pagination: { page, limit, total },
    })
  })
)

router.post("/", authenticateToken, authorizeAdmin, supplierValidation, asyncHandler(async (req, res) => {
  handleValidationResult(req)
  const supplier = new Supplier(req.body)
  await supplier.save()
  res.status(201).json(supplier)
}))

router.put("/:id", authenticateToken, authorizeAdmin, [param('id').isMongoId().withMessage('Invalid supplier id'), ...supplierValidation], asyncHandler(async (req, res) => {
  handleValidationResult(req)
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!supplier) {
    throw new HttpError(404, "Supplier not found")
  }
  res.status(200).json(supplier)
}))

router.delete("/:id", authenticateToken, authorizeAdmin, [param('id').isMongoId().withMessage('Invalid supplier id')], asyncHandler(async (req, res) => {
  handleValidationResult(req)

  const inUse = await Product.exists({ supplier: req.params.id })
  if (inUse) {
    throw new HttpError(409, 'Supplier cannot be deleted while products still reference it')
  }

  const supplier = await Supplier.findByIdAndDelete(req.params.id)
  if (!supplier) {
    throw new HttpError(404, "Supplier not found")
  }
  res.status(200).json({ message: "Supplier deleted successfully" })
}))

export default router
