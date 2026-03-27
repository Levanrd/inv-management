import { Schema, model } from 'mongoose'

export const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product reference is required"]
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity cannot be less than 1"]
  },
  price: {
    type: Number,
    required: [true, "Price per item is required"],
    min: [0, "Price cannot be negative"]
  },
  subtotal: {
    type: Number,
    required: [true, "Subtotal is required"],
    min: [0, "Subtotal cannot be negative"]
  },
  productSnapshot: {
    product_name: {
      type: String,
      required: true,
      trim: true
    },
    sku: {
      type: String,
      trim: true,
      default: ''
    }
  }
}, { timestamps: true })

export default model('OrderItem', orderItemSchema)
