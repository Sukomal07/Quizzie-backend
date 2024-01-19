import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import errorMiddleware from './middlewares/error.middleware.js'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

//import routes

import userRoutes from './routes/user.routes.js'
import quizRoutes from './routes/quiz.routes.js'

//routes config
app.use("/api/v1/account", userRoutes)
app.use("/api/v1/quiz", quizRoutes)

app.all("*", (req, res) => {
    res.status(404).json({
        status: 404,
        success: false,
        message: "!Oops page not found"
    })
})

app.use(errorMiddleware)
export default app