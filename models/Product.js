import { ConnectionPoolReadyEvent } from 'mongodb'
import { Schema, model } from 'mongoose'

const product = new Schema({
  product_name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
    maxlength: [100, "Product name cannot be more than 100 characters"]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [255, "Description cannot exceed 255 characters"]
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"]
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

export default model('Product', product)