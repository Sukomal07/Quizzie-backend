import express from 'express'
import { getProfile, loginUser, logoutUser, registerUser, updateProfile } from '../controllers/user.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = express.Router()

router.post('/signup', registerUser)
router.post('/login', loginUser)
router.post('/logout', logoutUser)
router.get('/profile', verifyJWT, getProfile)
router.patch('/update-profile', verifyJWT, updateProfile)

export default router