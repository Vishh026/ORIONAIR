const {  Server } = require('socket.io')
const cookie = require('cookie')
const jwt = require('jsonwebtoken')
const userModel = require('../models/user.model')

function initSocketServer(httpServer){
    const io = new Server(httpServer,{})

    io.use(async(socket,next)=> {
        const cookies = cookie.parse(socket.handshake.headers?.cookie || "")

        console.log(cookies);
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
        console.log("New socket connection",socket.id);    
    })
}

module.exports = initSocketServer