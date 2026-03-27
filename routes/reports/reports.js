import { Router } from 'express'
import Product from '../../models/Product.js'
import Category from '../../models/Category.js'
import Supplier from '../../models/Supplier.js'
import Order from '../../models/Order.js'
import User from '../../models/User.js'
import authenticateToken from '../../middlewares/authentication.js'
import asyncHandler from '../../utils/asyncHandler.js'

const router = Router()

router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userFilter = req.user.role === 'admin' ? {} : { user: req.user._id }

    const [
      productCount,
      categoryCount,
      supplierCount,
      userCount,
      orderCount,
      lowStockProducts,
      recentOrders,
      orderStatusSummary,
    ] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Supplier.countDocuments(),
      req.user.role === 'admin' ? User.countDocuments() : Promise.resolve(null),
      Order.countDocuments(userFilter),
      Product.find({ stock_qty: { $lte: 10 } })
        .sort({ stock_qty: 1, product_name: 1 })
        .limit(5)
        .populate('category supplier'),
      Order.find(userFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'user_name email')
        .populate('order_items.product', 'product_name sku'),
      Order.aggregate([
        { $match: userFilter },
        { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$total_amount' } } },
      ]),
    ])

    res.status(200).json({
      stats: {
        products: productCount,
        categories: categoryCount,
        suppliers: supplierCount,
        users: userCount,
        orders: orderCount,
      },
      lowStockProducts,
      recentOrders,
      orderStatusSummary,
    })
  })
)

export default router
