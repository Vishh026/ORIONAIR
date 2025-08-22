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
      const [message, vectors] = await Promise.all([
        messageModel.create({
          user: socket.user._id,
          content: messagePayload.content,
          chat: messagePayload.chat,
          role: "user",
        }),
        aiService.generateVector(messagePayload.content),
       
      ]);
      
      await  createMemory({
          vectors: vectors[0].values,
          messageId: message._id,
          metadata: {
            chat: messagePayload.chat,
            user: socket.user._id,
          },
        })
      /*const message = await messageModel.create({
        user: socket.user._id,
        content: messagePayload.content,
        chat: messagePayload.chat,
        role: "user",
      });

      const vectors = await aiService.generateVector(messagePayload.content);
      await createMemory({
        vectors: vectors[0].values,
        messageId: message._id,
        metadata: {
          chat: messagePayload.chat,
          user: socket.user._id,
        },
      });
      */

      let [memory, chatHistory] = await Promise.all([
        queryMemory({
          queryVector: vectors[0].values,
          limit: 1,
          metadata: {},
        }),
        messageModel
          .find({ chat: messagePayload.chat })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean(),
      ]);

      chatHistory = chatHistory.reverse();

      const stm = chatHistory.map((item) => {
        return {
          role: item.role,
          parts: [{ text: item.content }],
        };
      });

      const ltm = [
        {
          role: "user",
          parts: [
            {
              text: `
                    ${memory.map((item) => item.metadata.text).join("/n")}
                    `,
            },
          ],
        },
      ];

      const response = await aiService.generateResponse([...ltm, ...stm]);

      socket.emit("ai-response", {
        content: response,
        chat: messagePayload.chat,
      });


      const [responseMessage,responseVector] = await Promise.all([
        messageModel.create({
        user: socket.user._id,
        content: response,
        chat: messagePayload.chat,
        role: "model",
      }),aiService.generateVector(response)
      ])

      await createMemory({
        vectors: responseVector[0].values,
        messageId: responseMessage._id,
        metadata: {
          chat: messagePayload.chat,
          user: socket.user._id,
        },
      });

      
    });
  });
}

module.exports = initSocketServer;
