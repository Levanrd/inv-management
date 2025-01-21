import { Router } from "express"
import User from "../../models/User.js"
import authenticateToken from "../../middlewares/authentication.js"
import authorizeAdmin from "../../middlewares/authorization.js"

const router = Router()

// Get all users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.find()
    res.status(200).json(users)
  } catch (e) {
    console.error('Error fetching users:', e)
    res.status(400).json({ error: e.message })
  }
})

// Get user by id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.status(200).json(user)
  } catch (e) {
    console.error('Error fetching user:', e)
    res.status(500).json({ error: e.message })
  }
})

// Add new user (admin only)
router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { user_name, first_name, last_name, email, password, role } = req.body
    const user = new User({ user_name, first_name, last_name, email, password, role })
    await user.save()
    res.status(201).json({ message: 'User added successfully', user })
  } catch (e) {
    console.error('Error adding user:', e)
    res.status(400).json({ error: e.message })
  }
})

// Update user by id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user._id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden to perform this task" })
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.status(200).json(user)
  } catch (e) {
    console.error('Error updating user:', e)
    res.status(400).json({ error: e.message })
  }
})

// Delete user by id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.status(200).json({ message: 'User deleted successfully' })
  } catch (e) {
    console.error('Error deleting user:', e)
    res.status(400).json({ error: e.message })
  }
})

export default router