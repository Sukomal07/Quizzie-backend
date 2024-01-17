import express from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { createQuiz } from '../controllers/quiz.controller.js'

const router = express.Router()

router.post('/newquiz', verifyJWT, createQuiz)

export default router