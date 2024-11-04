import { Schema, model } from "mongoose"

const order = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User reference is required"]
  },
  items: [{
    type: Schema.Types.ObjectId,
    ref: "OrderItem",
    required: [true, "Order items are required"]
  }],
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