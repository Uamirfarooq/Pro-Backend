import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import Registeruser from './routes/user.routes.js'

const app = express()
// for handleing request
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    optionsSuccessStatus: 200,
}))
// for handleing json responces
app.use(express.json({
    limit: "16kb"
}))
// for handleing json url encoded data
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))
// for makeing a static folder to directly use the public folder
app.use(express.static("public"))
// for handling cookies
app.use(cookieParser())

app.use("/api/v1/users", Registeruser)

export default app
