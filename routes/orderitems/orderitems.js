import { Router } from "express"
import OrderItem from "../../models/OrderItem.js"
import authenticateToken from "../../middlewares/authentication.js"
import authorizeAdmin from "../../middlewares/authorization.js"

const router = Router()

// Add item to an order (authenticated users, must own the order or be admin)
router.post("/:orderId/items", authenticateToken, async (req, res) => {
  try {
    const order = await OrderItem.findById(req.params.orderId)
    if (!order) return res.status(404).json({ error: "Order not found" })

    if (req.user._id !== order.user.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden to modify this order" })
    }

    order.items.push(req.body) // req.body should contain product ID and quantity
    await order.save()
    res.status(201).json(order)
  } catch (error) {
    console.error("Error adding item:", error)
    res.status(400).json({ error: error.message })
  }
})

// Update item in an order (authenticated users, must own the order or be admin)
router.put("/:orderId/items/:itemId", authenticateToken, async (req, res) => {
  try {
    const order = await OrderItem.findById(req.params.orderId)
    if (!order) return res.status(404).json({ error: "Order not found" })

    if (req.user._id !== order.user.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden to modify this order" })
    }

    const item = order.items.id(req.params.itemId)
    if (!item) return res.status(404).json({ error: "Item not found" })

    item.quantity = req.body.quantity || item.quantity
    item.price = req.body.price || item.price
    await order.save()
    res.status(200).json(order)
  } catch (error) {
    console.error("Error updating item:", error)
    res.status(400).json({ error: error.message })
  }
})

// Delete item from an order (authenticated users, must own the order or be admin)
router.delete("/:orderId/items/:itemId", authenticateToken, async (req, res) => {
  try {
    const order = await OrderItem.findById(req.params.orderId)
    if (!order) return res.status(404).json({ error: "Order not found" })

    if (req.user._id !== order.user.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden to modify this order" })
    }

    const item = order.items.id(req.params.itemId)
    if (!item) return res.status(404).json({ error: "Item not found" })

    item.remove()
    await order.save()
    res.status(200).json(order)
  } catch (error) {
    console.error("Error deleting item:", error)
    res.status(400).json({ error: error.message })
  }
})

export default router
