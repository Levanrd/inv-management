import { Router } from "express"
import { body, param, query } from "express-validator"
import Order from "../../models/Order.js"
import User from "../../models/User.js"
import authenticateToken from "../../middlewares/authentication.js"
import authorizeAdmin from "../../middlewares/authorization.js"
import asyncHandler from "../../utils/asyncHandler.js"
import HttpError from "../../utils/httpError.js"
import { applyInventoryAdjustment, calculateOrderTotal, enrichOrderItems } from "../../utils/inventory.js"
import { buildPagination, handleValidationResult } from "../../utils/validation.js"

const router = Router()

const orderValidation = [
  body('user').isMongoId().withMessage('A valid user is required'),
  body('status').optional().isIn(['pending', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('order_items').isArray({ min: 1 }).withMessage('At least one order item is required'),
  body('order_items.*.product').isMongoId().withMessage('Each order item must include a valid product'),
  body('order_items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1').toInt(),
]

router.post('/', authenticateToken, orderValidation, asyncHandler(async (req, res) => {
  handleValidationResult(req)

  const canCreateForOtherUsers = req.user.role === 'admin'
  if (!canCreateForOtherUsers && req.user._id !== req.body.user) {
    throw new HttpError(403, 'You can only create orders for your own account')
  }

  const userExists = await User.exists({ _id: req.body.user })
  if (!userExists) {
    throw new HttpError(400, 'Selected user does not exist')
  }

  const orderItems = await enrichOrderItems(req.body.order_items)
  const total_amount = calculateOrderTotal(orderItems)

  await applyInventoryAdjustment(orderItems, -1)

  const order = await Order.create({
    user: req.body.user,
    order_items: orderItems,
    status: req.body.status || 'pending',
    total_amount,
  })

  await order.populate('user', 'user_name first_name last_name email role')
  await order.populate('order_items.product', 'product_name sku price stock_qty')

  res.status(201).json({ message: 'Order created successfully', order })
}))

router.get(
  '/',
  authenticateToken,
  [
    query('status').optional().isIn(['pending', 'completed', 'cancelled']).withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  asyncHandler(async (req, res) => {
    handleValidationResult(req)

    const { page, limit, skip } = buildPagination(req)
    const filter = {}

    if (req.user.role !== 'admin') {
      filter.user = req.user._id
    }

    if (req.query.status) {
      filter.status = req.query.status
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'user_name first_name last_name email role')
        .populate('order_items.product', 'product_name sku price stock_qty'),
      Order.countDocuments(filter),
    ])

    res.status(200).json({
      items: orders,
      pagination: { page, limit, total },
    })
  })
)

router.get('/:id', authenticateToken, [param('id').isMongoId().withMessage('Invalid order id')], asyncHandler(async (req, res) => {
  handleValidationResult(req)

  const order = await Order.findById(req.params.id)
    .populate('user', 'user_name first_name last_name email role')
    .populate('order_items.product', 'product_name sku price stock_qty')

  if (!order) {
    throw new HttpError(404, 'Order not found')
  }

  if (req.user.role !== 'admin' && String(order.user._id) !== req.user._id) {
    throw new HttpError(403, 'Forbidden to view this order')
  }

  res.status(200).json(order)
}))

router.put('/:id', authenticateToken, authorizeAdmin, [param('id').isMongoId().withMessage('Invalid order id'), body('status').isIn(['pending', 'completed', 'cancelled']).withMessage('Invalid status')], asyncHandler(async (req, res) => {
  handleValidationResult(req)

  const order = await Order.findById(req.params.id)
  if (!order) {
    throw new HttpError(404, 'Order not found')
  }

  const previousStatus = order.status
  order.status = req.body.status

  if (previousStatus !== 'cancelled' && req.body.status === 'cancelled') {
    await applyInventoryAdjustment(order.order_items, 1)
  }

  if (previousStatus === 'cancelled' && req.body.status !== 'cancelled') {
    await applyInventoryAdjustment(order.order_items, -1)
  }

  await order.save()
  await order.populate('user', 'user_name first_name last_name email role')
  await order.populate('order_items.product', 'product_name sku price stock_qty')

  res.status(200).json(order)
}))

router.delete('/:id', authenticateToken, authorizeAdmin, [param('id').isMongoId().withMessage('Invalid order id')], asyncHandler(async (req, res) => {
  handleValidationResult(req)

  const order = await Order.findById(req.params.id)
  if (!order) {
    throw new HttpError(404, 'Order not found')
  }

  if (order.status !== 'cancelled') {
    await applyInventoryAdjustment(order.order_items, 1)
  }

  await order.deleteOne()
  res.status(200).json({ message: 'Order deleted successfully' })
}))

export default router
