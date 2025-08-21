const app = require('./src/app')
require('dotenv').config()
const connectDB = require('./src/db/db')
const initSocketServer = require('./src/sockets/server.socket')
const httpServer = require('http').createServer(app)

connectDB()
initSocketServer(httpServer)

const server  = httpServer.listen(3000,()=> {
    console.log("Server running on port 3000");
})

module.exports = server


