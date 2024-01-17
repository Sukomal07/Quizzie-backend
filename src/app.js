import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'


const app = express()

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.all("*", (req, res) => {
    res.status(404).json({
        status: 404,
        success: false,
        message: "!Oops page not found"
    })
})

export default app