import Product from '../models/Product.js'
import HttpError from './httpError.js'

const roundCurrency = (value) => Number(Number(value).toFixed(2))

export const enrichOrderItems = async (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'At least one order item is required')
  }

  const productIds = items.map((item) => item.product)
  const products = await Product.find({ _id: { $in: productIds } }).lean()
  const productMap = new Map(products.map((product) => [String(product._id), product]))

  return items.map((item) => {
    const product = productMap.get(String(item.product))

    if (!product) {
      throw new HttpError(400, `Product not found for order item ${item.product}`)
    }

    const quantity = Number(item.quantity)

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new HttpError(400, `Invalid quantity for ${product.product_name}`)
    }

    if (quantity > product.stock_qty) {
      throw new HttpError(409, `Insufficient stock for ${product.product_name}`)
    }

    return {
      product: product._id,
      quantity,
      price: roundCurrency(product.price),
      subtotal: roundCurrency(product.price * quantity),
      productSnapshot: {
        product_name: product.product_name,
        sku: product.sku,
      },
    }
  })
}

export const applyInventoryAdjustment = async (items = [], direction) => {
  const bulkOperations = items.map((item) => ({
    updateOne: {
      filter: { _id: item.product },
      update: { $inc: { stock_qty: direction * item.quantity } },
    },
  }))

  if (bulkOperations.length > 0) {
    await Product.bulkWrite(bulkOperations)
  }
}

export const calculateOrderTotal = (items = []) =>
  roundCurrency(items.reduce((sum, item) => sum + item.subtotal, 0))
