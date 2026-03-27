import { Router } from "express"
import { body, param, query } from "express-validator"
import Product from "../../models/Product.js"
import Category from "../../models/Category.js"
import Supplier from "../../models/Supplier.js"
import authenticateToken from "../../middlewares/authentication.js"
import authorizeAdmin from "../../middlewares/authorization.js"
import asyncHandler from "../../utils/asyncHandler.js"
import HttpError from "../../utils/httpError.js"
import { buildPagination, handleValidationResult } from "../../utils/validation.js"

const router = Router()

const productValidation = [
  body('sku').optional({ nullable: true }).trim().isLength({ max: 30 }).withMessage('SKU cannot exceed 30 characters'),
  body('product_name').trim().isLength({ min: 2, max: 100 }).withMessage('Product name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ max: 255 }).withMessage('Description cannot exceed 255 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number').toFloat(),
  body('stock_qty').isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative integer').toInt(),
  body('category').isMongoId().withMessage('Category is required'),
  body('supplier').isMongoId().withMessage('Supplier is required'),
]

const ensureDependenciesExist = async ({ category, supplier }) => {
  const [categoryExists, supplierExists] = await Promise.all([
    Category.exists({ _id: category }),
    Supplier.exists({ _id: supplier }),
  ])

  if (!categoryExists) {
    throw new HttpError(400, 'Selected category does not exist')
  }

  if (!supplierExists) {
    throw new HttpError(400, 'Selected supplier does not exist')
  }
}

router.get(
  "/",
  authenticateToken,
  [
    query('search').optional().trim(),
    query('category').optional().isMongoId().withMessage('Invalid category filter'),
    query('supplier').optional().isMongoId().withMessage('Invalid supplier filter'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  asyncHandler(async (req, res) => {
    handleValidationResult(req)

    const { page, limit, skip } = buildPagination(req)
    const { search = '', category, supplier } = req.query
    const filter = {}

    if (search) {
      filter.$or = [
        { product_name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    if (category) {
      filter.category = category
    }

    if (supplier) {
      filter.supplier = supplier
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ updatedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate("category supplier"),
      Product.countDocuments(filter),
    ])

    res.status(200).json({
      items: products,
      pagination: { page, limit, total },
    })
  })
)

router.get("/:id", authenticateToken, [param('id').isMongoId().withMessage('Invalid product id')], asyncHandler(async (req, res) => {
  handleValidationResult(req)
  const product = await Product.findById(req.params.id).populate("category supplier")
  if (!product) {
    throw new HttpError(404, "Product not found")
  }
  res.status(200).json(product)
}))

router.post("/", authenticateToken, authorizeAdmin, productValidation, asyncHandler(async (req, res) => {
  handleValidationResult(req)
  await ensureDependenciesExist(req.body)
  const product = new Product(req.body)
  await product.save()
  await product.populate("category supplier")
  res.status(201).json(product)
}))

router.post("/bulk-upload", authenticateToken, authorizeAdmin, asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body) || req.body.length === 0) {
    throw new HttpError(400, "No valid products provided")
  }

  if (req.body.length > 500) {
    throw new HttpError(400, "Maximum 500 products allowed per bulk upload")
  }

  const categoryIds = [...new Set(req.body.map((product) => product.category).filter(Boolean))]
  const supplierIds = [...new Set(req.body.map((product) => product.supplier).filter(Boolean))]

  const [categories, suppliers] = await Promise.all([
    Category.find({ _id: { $in: categoryIds } }).select('_id').lean(),
    Supplier.find({ _id: { $in: supplierIds } }).select('_id').lean(),
  ])

  const categorySet = new Set(categories.map((item) => String(item._id)))
  const supplierSet = new Set(suppliers.map((item) => String(item._id)))

  const validProducts = []
  const invalidProducts = []

  req.body.forEach((product, index) => {
    const hasRequiredFields =
      product.product_name &&
      Number.isFinite(Number(product.price)) &&
      Number.isInteger(Number(product.stock_qty)) &&
      product.category &&
      product.supplier

    if (!hasRequiredFields) {
      invalidProducts.push({ index, reason: 'Missing required fields', product })
      return
    }

    if (!categorySet.has(String(product.category)) || !supplierSet.has(String(product.supplier))) {
      invalidProducts.push({ index, reason: 'Invalid category or supplier', product })
      return
    }

    validProducts.push({
      sku: product.sku?.trim() || undefined,
      product_name: product.product_name.trim(),
      description: product.description?.trim() || '',
      price: Number(product.price),
      stock_qty: Number(product.stock_qty),
      category: product.category,
      supplier: product.supplier,
    })
  })

  const inserted = validProducts.length ? await Product.insertMany(validProducts, { ordered: false }) : []

  res.status(201).json({
    message: `${inserted.length} products added`,
    invalidProducts,
  })
}))

router.put("/:id", authenticateToken, authorizeAdmin, [param('id').isMongoId().withMessage('Invalid product id'), ...productValidation], asyncHandler(async (req, res) => {
  handleValidationResult(req)
  await ensureDependenciesExist(req.body)
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate("category supplier")
  if (!product) {
    throw new HttpError(404, "Product not found")
  }
  res.status(200).json(product)
}))

router.delete("/:id", authenticateToken, authorizeAdmin, [param('id').isMongoId().withMessage('Invalid product id')], asyncHandler(async (req, res) => {
  handleValidationResult(req)
  const product = await Product.findByIdAndDelete(req.params.id)
  if (!product) {
    throw new HttpError(404, "Product not found")
  }
  res.status(200).json({ message: "Product deleted successfully" })
}))

export default router
