const { Pinecone } = require("@pinecone-database/pinecone");

const pc = new Pinecone({ apiKey: process.env.Pinecone_API });

const orionAIIndex = pc.index("orion-ai");

async function createMemory({ vectors, metadata, messageId }) {
  // upsert : update if exists, insert if not.
  await orionAIIndex.upsert([
    {
      id: messageId,
      values: vectors, //actual msg => vector embedding  of msg
      metadata,
    },
  ]);
}

async function queryMemory({ queryVector, limit = 3, metadata }) {
  // find the top 3  most similar data in the chat
  const data = await orionAIIndex.query({
    vector: queryVector,
    topK: limit,
    filter: metadata ? { metadate } : undefined,
    includeMetadata: true,
  });
  return data.matches;
}

module.exports = { createMemory,queryMemory }
