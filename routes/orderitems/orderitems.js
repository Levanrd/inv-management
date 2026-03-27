import { Router } from "express"
import { param } from "express-validator"
import Order from "../../models/Order.js"
import authenticateToken from "../../middlewares/authentication.js"
import asyncHandler from "../../utils/asyncHandler.js"
import HttpError from "../../utils/httpError.js"
import { handleValidationResult } from "../../utils/validation.js"

const router = Router()

router.get("/", authenticateToken, asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { user: req.user._id }
  const orders = await Order.find(filter)
    .select('order_items user status total_amount createdAt updatedAt')
    .populate('user', 'user_name email')
    .populate('order_items.product', 'product_name sku price')

  const items = orders.flatMap((order) =>
    order.order_items.map((item) => ({
      ...item.toObject(),
      orderId: order._id,
      orderStatus: order.status,
      orderUser: order.user,
    }))
  )

  res.status(200).json(items)
}))

router.get("/:orderId", authenticateToken, [param('orderId').isMongoId().withMessage('Invalid order id')], asyncHandler(async (req, res) => {
  handleValidationResult(req)

  const order = await Order.findById(req.params.orderId)
    .populate('user', 'user_name email')
    .populate('order_items.product', 'product_name sku price')

  if (!order) {
    throw new HttpError(404, "Order not found")
  }

  if (req.user.role !== 'admin' && String(order.user._id) !== req.user._id) {
    throw new HttpError(403, 'Forbidden to view this order')
  }

  res.status(200).json(order.order_items)
}))

export default router
