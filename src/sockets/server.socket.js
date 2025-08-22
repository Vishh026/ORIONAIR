const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service");
const messageModel = require("../models/message.model");
const { createMemory, queryMemory } = require("../services/vector.service");
function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
    if (!cookies.token) {
      next(new Error("Authentication Error: no token provided"));
      console.log("cokies.token=", cookies.token);
    }
    try {
      const decoded = jwt.verify(cookies.token, process.env.SECRET_KEY);
      const user = await userModel.findById(decoded.id);

      socket.user = user;

      next();
    } catch (error) {
      next(new Error("Authentication Error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("ai-message", async (messagePayload) => {
      const message = await messageModel.create({
        user: socket.user._id,
        content: messagePayload.content,
        chat: messagePayload.chat,
        role: "user",
      });
      const vectors = await aiService.generateVector(messagePayload.content);
      const memory = await queryMemory({
        queryVector: vectors[0].values,
        limit: 1,
        metadate: {},
      });

      await createMemory({
        vectors: vectors[0].values,
        messageId: message._id,
        metadata: {
          chat: messagePayload.chat,
          user: socket.user._id,
        },
      });

      const chatHistory = (
        await messageModel
          .find({
            chat: messagePayload.chat,
          })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean()
      ).reverse();

      const stm =  chatHistory.map((item) => {
          return {
            role: item.role,
            parts: [{ text: item.content }],
          };
        })

        const ltm = [
            {
                role:"user",
                parts:[{text: `
                    ${memory.map(item => item.metadata.text).join('/n')}
                    `}]
            }
        ]
    

      const response = await aiService.generateResponse([...ltm,...stm]);

      const responseMessage = await messageModel.create({
        user: socket.user._id,
        content: response,
        chat: messagePayload.chat,
        role: "model",
      });

      const responseVector = await aiService.generateVector(response);

      await createMemory({
        vectors: responseVector[0].values,
        messageId: responseMessage._id,
        metadata: {
          chat: messagePayload.chat,
          user: socket.user._id,
        },
      });

      socket.emit("ai-response", {
        content: response,
        chat: messagePayload.chat,
      });
    });
  });
}

module.exports = initSocketServer;
