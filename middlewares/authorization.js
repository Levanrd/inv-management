import HttpError from "../utils/httpError.js"

const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next()
  } else {
    next(new HttpError(403, "Forbidden to perform this task"))
  }
}

export default authorizeAdmin
