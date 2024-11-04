import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.status(200).json({ message: 'Report API v1' })
})

export default router