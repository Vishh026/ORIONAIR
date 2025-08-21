const {  Server } = require('socket.io')
const cookie = require('cookie')
const jwt = require('jsonwebtoken')
const userModel = require('../models/user.model')
const aiService = require('../services/ai.service')
const messageModel = require('../models/message.model')

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

            await messageModel.create({
                user: socket.user._id,
                content: messagePayload.content,
                chat: messagePayload.chat,
                role:"user"
            })

            const chatHistory = (await messageModel.find({
                chat:messagePayload.chat
            }).sort({ createdAt: -1 }).limit(20).lean()).reverse()
           
            
            const response = await aiService.generateResponse(chatHistory.map(item=> {
            return {
                role:item.role,
                parts:[{text: item.content}]
            }
           }))

            await messageModel.create({
                user: socket.user._id,
                content: response,
                chat: messagePayload.chat,
                role:"model"
            })

            socket.emit('ai-response',{
                content:response,
                chat: messagePayload.chat
            })
            
        })
    })
}

module.exports = initSocketServer