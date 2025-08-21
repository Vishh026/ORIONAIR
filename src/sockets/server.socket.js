const {  Server } = require('socket.io')
const cookie = require('cookie')
const jwt = require('jsonwebtoken')
const userModel = require('../models/user.model')
const aiService = require('../services/ai.service')

function initSocketServer(httpServer){
    const io = new Server(httpServer,{})

    io.use(async(socket,next)=> {
        const cookies = cookie.parse(socket.handshake.headers?.cookie || "")
        if(!cookies.token){
            next(new Error("Authentication Error: no token provided"))
            console.log("cokies.token=",cookies.token);
        }
        try {
            const decoded = jwt.verify(cookies.token,process.env.SECRET_KEY)
            const user = await userModel.findById(decoded.id)

            socket.user = user;

            next()

        } catch (error) {
            next(new Error("Authentication Error: Invalid token"))
        }
    })

    io.on('connection',(socket) => {
        
        socket.on('ai-message',async(messagePayload) => {
            console.log(messagePayload);

            const response = await aiService.generateResponse(messagePayload.content)

            socket.emit('ai-response',{
                content:response,
                chat: messagePayload.chat
            })
            
        })
    })
}

module.exports = initSocketServer