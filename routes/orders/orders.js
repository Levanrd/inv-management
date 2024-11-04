import { Router } from "express"
import Order from "../../models/Order.js"
import authenticateToken from "../../middlewares/authentication.js"
import authorizeAdmin from "../../middlewares/authorization.js"

const router = Router()

// Create a new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { user, items, status, total_amount } = req.body
    const order = new Order({ user, items, status, total_amount })
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
    const orders = await Order.find().populate('user').populate('items')
    res.status(200).json(orders)
  } catch (e) {
    console.error('Error fetching orders:', e)
    res.status(400).json({ error: e.message })
  }
})

// Get order by id (authenticated user)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user').populate('items')
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.status(200).json(order)
  } catch (e) {
    console.error('Error fetching order:', e)
    res.status(500).json({ error: e.message })
  }
})

// Update order by id (authenticated user or admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { user, items, status, total_amount } = req.body
    const order = await Order.findByIdAndUpdate(req.params.id, { user, items, status, total_amount }, { new: true })
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