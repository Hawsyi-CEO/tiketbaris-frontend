const OpenAI = require('openai');

const apiKey = process.env.OPENAI_API_KEY;
const defaultModel = process.env.OPENAI_DEFAULT_MODEL || 'gpt-5-mini';

let client = null;
if (apiKey) {
  client = new OpenAI({ apiKey });
}

async function chatCompletion({ messages = [], max_tokens = 800, temperature = 0.2, model } = {}) {
  if (!client) {
    throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY in environment.');
  }

  const useModel = model || defaultModel;

  // Use OpenAI SDK chat completions
  const resp = await client.chat.completions.create({
    model: useModel,
    messages,
    max_tokens,
    temperature
  });

  return resp;
}

module.exports = {
  chatCompletion,
};
