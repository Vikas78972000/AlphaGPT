import 'dotenv/config';
import fetch from 'node-fetch';

const getOpenAIAPIResponse = async (message) => {
  if (!message) return 'Message is required';

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tngtech/deepseek-r1t2-chimera:free',
      messages: [{ role: 'user', content: message }],
    }),
  };

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', options);

    // Get text first
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text); // try parsing JSON
    } catch {
      return `API returned non-JSON response: ${text}`;
    }

    console.log('Parsed OpenRouter response:', JSON.stringify(data, null, 2));

    // Handle error returned by provider
    if (data?.error?.message) {
      return `API Error: ${data.error.message}`;
    }

    // Normal response
    if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
    if (data?.choices?.[0]?.content?.[0]?.text) return data.choices[0].content[0].text;
    if (data?.output_text) return data.output_text;

    return `Unexpected API response: ${JSON.stringify(data)}`;
  } catch (err) {
    console.error('Fetch error:', err);
    return 'Failed to connect to OpenRouter';
  }
};

export default getOpenAIAPIResponse;
