import { Router } from "express"
import Order from "../../models/Order.js"
import authenticateToken from "../../middlewares/authentication.js"
import authorizeAdmin from "../../middlewares/authorization.js"

const router = Router()

// Get all orders (admin only)
router.get("/", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "username email").populate("items.product")
    res.status(200).json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get a specific order (user can view their own, admin can view any)
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product")
    if (!order) return res.status(404).json({ error: "Order not found" })

    if (req.user._id !== order.user.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden to view this order" })
    }

    res.status(200).json(order)
  } catch (error) {
    console.error("Error fetching order:", error)
    res.status(500).json({ error: error.message })
  }
})

// Create a new order (authenticated users only)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const order = new Order({
      ...req.body,
      user: req.user._id,
      status: "pending",
    });
    await order.save()
    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error)
    res.status(400).json({ error: error.message })
  }
})

// Update order status (admin only)
router.put("/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })
    if (!order) return res.status(404).json({ error: "Order not found" })
    res.status(200).json(order)
  } catch (error) {
    console.error("Error updating order:", error)
    res.status(500).json({ error: error.message })
  }
})

// Delete an order (admin only)
router.delete("/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id)
    if (!order) return res.status(404).json({ error: "Order not found" })
    res.status(200).json({ message: "Order deleted successfully" })
  } catch (error) {
    console.error("Error deleting order:", error)
    res.status(500).json({ error: error.message })
  }
})

export default router