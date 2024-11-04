import { Schema, model } from 'mongoose'

const category = new Schema({
  category_name: {
    type: String,
    required: [true, "Category name is required"],
    unique: true,
    trim: true,
    maxlength: [50, "Category name cannot be more than 50 characters"]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [255, "Description cannot exceed 255 characters"]
  },

}, { timestamps: true })

export default model('Category', category)