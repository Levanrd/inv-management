import { Router } from "express"
import Category from "../../models/Category.js"
import authenticateToken from "../../middlewares/authentication.js"
import authorizeAdmin from "../../middlewares/authorization.js"

const router = Router()

// Get all categories (authenticated)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const categories = await Category.find()
    res.status(200).json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    res.status(500).json({ error: error.message })
  }
})

// Create a new category (admin only)
router.post("/", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const category = new Category(req.body)
    await category.save()
    res.status(201).json(category)
  } catch (e) {
    console.error("Error creating category:", e)
    res.status(400).json({ error: e.errors })
  }
})

// Update a category (admin only)
router.put("/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!category) return res.status(404).json({ error: "Category not found" })
    res.status(200).json(category)
  } catch (e) {
    console.error("Error updating category:", e)
    res.status(400).json({ error: e.errors })
  }
})

// Delete a category (admin only)
router.delete("/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) return res.status(404).json({ error: "Category not found" })
    res.status(200).json({ message: "Category deleted successfully" })
  } catch (e) {
    console.error("Error deleting category:", e)
    res.status(400).json({ error: e.errors })
  }
})

export default router
