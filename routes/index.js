import { Router } from "express"
import auth from "./auth/auth.js"
import users from "./users/users.js"
import categories from "./categories/categories.js"
import products from "./products/products.js"
import suppliers from "./suppliers/suppliers.js"
import orders from "./orders/orders.js"
import orderitems from "./orderitems/orderitems.js"
import reports from "./reports/reports.js"

const router = Router()

router.use("/auth", auth)
router.use("/users", users)
router.use("/categories", categories)
router.use("/products", products)
router.use("/suppliers", suppliers)
router.use("/orders", orders)
router.use("/orderitems", orderitems)
router.use("/reports", reports)

export default router
