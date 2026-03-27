import { Schema, model } from "mongoose"
import { orderItemSchema } from "./OrderItem.js"

const order = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User reference is required"]
  },
  order_items: {
    type: [orderItemSchema],
    validate: {
      validator: (items) => Array.isArray(items) && items.length > 0,
      message: "Order items are required"
    }
  },
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending"
  },
  total_amount: {
    type: Number,
    required: [true, "Total amount is required"],
    min: [0, "Total amount cannot be negative"]
  }
}, { timestamps: true })

export default model("Order", order)
