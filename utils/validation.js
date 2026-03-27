import { validationResult } from 'express-validator'
import HttpError from './httpError.js'

export const handleValidationResult = (req) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    throw new HttpError(
      400,
      'Validation failed',
      errors.array().map((error) => error.msg)
    )
  }
}

export const paginationValidators = {
  page: {
    in: ['query'],
    optional: true,
    isInt: {
      options: { min: 1 },
      errorMessage: 'Page must be at least 1',
    },
    toInt: true,
  },
  limit: {
    in: ['query'],
    optional: true,
    isInt: {
      options: { min: 1, max: 100 },
      errorMessage: 'Limit must be between 1 and 100',
    },
    toInt: true,
  },
}

export const buildPagination = (req) => {
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 25

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  }
}
