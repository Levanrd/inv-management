import { Router } from "express"
import Order from "../../models/Order.js"
import OrderItem from "../../models/OrderItem.js"
import authenticateToken from "../../middlewares/authentication.js"
import authorizeAdmin from "../../middlewares/authorization.js"

const router = Router()

// Create a new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { user, order_items, status, total_amount } = req.body

    // Check if order items are provided
    if(!Array.isArray(order_items) || order_items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' })
    }

    // Create the Order
    const order = new Order({ user, status, total_amount })
    await order.save()

    // Validate and save each Order Item
    const orderItems = await Promise.all(order_items.map(async item => {
      const orderItem = new OrderItem({ ...item, order: order._id })
      await orderItem.save()
      return orderItem._id
    }))

    // Update the Order with the Order Items
    order.order_items = orderItems
    await order.save()

    res.status(201).json({ message: 'Order created successfully', order })
  } catch (e) {
    console.error('Error creating order:', e)
    res.status(400).json({ error: e.message })
  }
})

// Get all orders (admin only)
router.get('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate('user').populate('order_items')
    res.status(200).json(orders)
  } catch (e) {
    console.error('Error fetching orders:', e)
    res.status(400).json({ error: e.message })
  }
})

// Get order by id (admin only)
router.get('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user').populate('items')
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.status(200).json(order)
  } catch (e) {
    console.error('Error fetching order:', e)
    res.status(500).json({ error: e.message })
  }
})

// Update order by id (admin only)
router.put('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { user, order_items, status, total_amount } = req.body
    const order = await Order.findByIdAndUpdate(req.params.id, { user, order_items, status, total_amount }, { new: true })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.status(200).json(order)
  } catch (e) {
    console.error('Error updating order:', e)
    res.status(400).json({ error: e.message })
  }
})

// Delete order by id (admin only)
router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.status(200).json({ message: 'Order deleted successfully' })
  } catch (e) {
    console.error('Error deleting order:', e)
    res.status(400).json({ error: e.message })
  }
})

export default router