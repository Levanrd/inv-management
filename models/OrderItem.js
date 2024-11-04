import { Schema, model } from 'mongoose'

const orderItem = new Schema({
  order: {
    type: Schema.Types.ObjectId,
    ref: "Order",
    required: [true, "Order reference is required"]
  },
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
  }
}, { timestamps: true })

export default model('OrderItem', orderItem)