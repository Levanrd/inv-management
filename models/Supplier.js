import { Schema, model } from 'mongoose'

const supplier = new Schema({
  supplier_name: {
    type: String,
    required: [true, "Supplier name is required"],
    unique: true,
    trim: true,
    maxlength: [50, "Supplier name cannot be more than 50 characters"]
  },
  contact_info: {
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      maxlength: [255, "Address cannot exceed 255 characters"]
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      maxlength: [15, "Phone number cannot exceed 15 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      maxlength: [50, "Email cannot exceed 50 characters"]
    }
  }
}, { timestamps: true })

export default model('Supplier', supplier)