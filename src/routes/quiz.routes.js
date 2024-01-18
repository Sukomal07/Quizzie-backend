import express from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { attemptPollQuiz, attemptQNAQuiz, createQuiz, deleteQuiz, getQuizAnalysis, getQuizById, getTrendingQuiz, updateQuiz } from '../controllers/quiz.controller.js'

const router = express.Router()

router.post('/newquiz', verifyJWT, createQuiz)
router.get('/dashboard', verifyJWT, getTrendingQuiz)
router.get('/analysis', verifyJWT, getQuizAnalysis)
router.delete('/:quizId/delete', verifyJWT, deleteQuiz)
router.put('/:quizId/update', verifyJWT, updateQuiz)
router.get('/:quizId', getQuizById)
router.post('/:quizId/qna', attemptQNAQuiz)
router.post('/:quizId/poll', attemptPollQuiz)

export default router