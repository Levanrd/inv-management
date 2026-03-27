import jwt from "jsonwebtoken"
import HttpError from "../utils/httpError.js"

const authenticateToken = (req, res, next) => {
  const authHeader = req.header("Authorization")
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new HttpError(401, "No token provided"))
    return
  }

  const token = authHeader.split(" ")[1]
  
  if (!token) {
    next(new HttpError(401, "No token provided"))
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      next(new HttpError(401, "Token expired"))
      return
    }
    if (e.name === 'JsonWebTokenError') {
      next(new HttpError(401, "Invalid token"))
      return
    }
    next(new HttpError(401, "Authentication failed"))
  }
}

export default authenticateToken
