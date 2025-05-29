import { Router } from "express"
import OrderItem from "../../models/OrderItem.js"
import Order from "../../models/Order.js"
import authenticateToken from "../../middlewares/authentication.js"
import authorizeAdmin from "../../middlewares/authorization.js"

const router = Router()

// Add order item to an existing order (authenticated users, must own the order or be admin)
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

// Update order item in an existing order (authenticated users, must own the order or be admin)
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

router.delete("/:itemId", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    // Find the OrderItem document and delete it
    const orderItem = await OrderItem.findByIdAndDelete(req.params.itemId);
    if (!orderItem) return res.status(404).json({ error: "Order Item not found" });

    // Also remove the reference from any Order that contains this order item
    await Order.updateMany(
      { order_items: req.params.itemId },
      { $pull: { order_items: req.params.itemId } }
    );

    res.status(200).json({ message: "Order Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting order item:", error);
    res.status(400).json({ error: error.message });
  }
});



// Delete order item from an existing order (authenticated users, must own the order or be admin)
router.delete("/:orderId/items/:itemId", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    // Find the order
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Find the order item inside the order_items array
    const itemIndex = order.order_items.findIndex(item => item.toString() === req.params.itemId);
    if (itemIndex === -1) return res.status(404).json({ error: "Order Item not found" });

    // Remove the order item reference from order_items array
    order.order_items.splice(itemIndex, 1);
    await order.save();

    // Delete the actual OrderItem document from the database
    await OrderItem.findByIdAndDelete(req.params.itemId);

    res.status(200).json({ message: "Order item removed from order and deleted" });
  } catch (error) {
    console.error("Error deleting item from order:", error);
    res.status(400).json({ error: error.message });
  }
});



export default router
