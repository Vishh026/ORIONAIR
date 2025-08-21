const express = require('express')
const cookieParser = require('cookie-parser')
const authRoutes = require('./routes/auth.route')
const chatRoutes = require('./routes/chat.route')

const app = express()

// Body parser + cookies must come first
app.use(express.json())
app.use(cookieParser())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)


module.exports = app
