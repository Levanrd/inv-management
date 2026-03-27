export const sanitizeUser = (user) => ({
  _id: user._id,
  user_name: user.user_name,
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})
