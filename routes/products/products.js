import { Router } from "express"
import Product from "../../models/Product.js"
import authenticateToken from "../../middlewares/authentication.js"
import authorizeAdmin from "../../middlewares/authorization.js"

const router = Router()

// Get all products (authenticated user)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const products = await Product.find()
      // .sort({ _id: -1 })
      .populate("category supplier")
      
    res.status(200).json(products)
  } catch (e) {
    console.error("Error fetching products:", e)
    res.status(500).json({ error: e })
  }
})

// Get product by id (authenticated user)
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category supplier")
    if (!product) return res.status(404).json({ error: "Product not found" })
    res.status(200).json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    res.status(500).json({ error: error.message })
  }
})

// Create new product (admin only)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const product = new Product(req.body)
    await product.save()
    res.status(201).json(product)
  } catch (e) {
    console.error("Error creating product:", e)
    res.status(400).json({ error: e.errors })
  }
})

// Bulk upload products (admin only)
router.post("/bulk-upload", authenticateToken, async (req, res) => {
  try {
    const products = req.body
    if(!Array.isArray(products) || !products.length) {
      console.log(products)
      return res.status(400).json({ error: "No valid products provided" })
    }

    let newProducts = []
    let invalidProducts = []

    for (let product of products) {
      // Validate required fields
      if (
        !product.product_name ||
        product.price == null ||
        product.stock_qty == null ||
        !product.category ||
        !product.supplier
      ) {
        invalidProducts.push(product)
        continue
      }

      let newProduct = new Product({
        product_name: product.product_name,
        description: product.description || "",
        price: product.price,
        stock_qty: product.stock_qty,
        category: product.category,
        supplier: product.supplier,
      })

      newProducts.push(newProduct)
    }

    if (newProducts.length) {
      await Product.insertMany(newProducts)
    }

    res.status(201).json({
      message: `${newProducts.length} products added`,
      invalidProducts: invalidProducts.length,
      invalidProducts
    })
  } catch (e) {
    console.error("Error bulk uploading products: ", e)
    res.status(500).json({ error: e.message})
  }
})

// Update product by id (admin only)
router.put("/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!product) return res.status(404).json({ error: "Product not found" })
    res.status(200).json(product)
  } catch (error) {
    console.error("Error updating product:", error)
    res.status(500).json({ error: error.message })
  }
})

// Delete product by id (admin only)
router.delete("/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ error: "Product not found" })
    res.status(200).json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    res.status(500).json({ error: error.message })
  }
})

export default router