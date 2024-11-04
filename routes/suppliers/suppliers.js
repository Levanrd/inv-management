import { Router } from "express"
import Supplier from "../../models/Supplier.js"
import authenticateToken from "../../middlewares/authentication.js"
import authorizeAdmin from "../../middlewares/authorization.js"

const router = Router()

// Get all supplier (authenticated)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const supplier = await Supplier.find()
    res.status(200).json(supplier)
  } catch (error) {
    console.error("Error fetching supplier:", error)
    res.status(500).json({ error: error.message })
  }
})

// Create a new supplier (admin only)
router.post("/", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const supplier = new Supplier(req.body)
    await supplier.save()
    res.status(201).json(supplier)
  } catch (error) {
    console.error("Error creating supplier:", error)
    res.status(400).json({ error: error.message })
  }
})

// Update a supplier (admin only)
router.put("/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!supplier) return res.status(404).json({ error: "Supplier not found" })
    res.status(200).json(supplier)
  } catch (error) {
    console.error("Error updating supplier:", error)
    res.status(500).json({ error: error.message })
  }
})

// Delete a supplier (admin only)
router.delete("/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id)
    if (!supplier) return res.status(404).json({ error: "Supplier not found" })
    res.status(200).json({ message: "Supplier deleted successfully" })
  } catch (error) {
    console.error("Error deleting category:", error)
    res.status(500).json({ error: error.message })
  }
})

export default router
