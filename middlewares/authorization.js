const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next()
  } else {
    res.status(403).json({ error: "Forbidden to perform this task" })
  }
}

export default authorizeAdmin