import { Schema, model } from 'mongoose'

const product = new Schema({
  sku: {
    type: String,
    trim: true,
    uppercase: true,
    unique: true,
    sparse: true,
    maxlength: [30, "SKU cannot be more than 30 characters"]
  },
  product_name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
    maxlength: [100, "Product name cannot be more than 100 characters"],
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [255, "Description cannot exceed 255 characters"]
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
    set: (value) => Number(Number(value).toFixed(2))
  },
  stock_qty: {
    type: Number,
    required: [true, "Stock quantity is required"],
    min: [0, "Stock quantity cannot be negative"]
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "Category is required"]
  },
  supplier: {
    type: Schema.Types.ObjectId,
    ref: "Supplier",
    required: [true, "Supplier is required"]
  }
}, { timestamps: true })

product.index({ product_name: 1, category: 1 })

export default model('Product', product)
