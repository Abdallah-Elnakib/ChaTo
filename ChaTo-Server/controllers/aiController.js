const axios = require('axios');

exports.askAI = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ message: 'Prompt is required.' });
    }
    // Using HuggingFace free inference API (distilGPT2)
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/distilgpt2',
      { inputs: prompt },
      { headers: { 'Accept': 'application/json' } }
    );
    const aiText = response.data && response.data.length > 0 && response.data[0].generated_text
      ? response.data[0].generated_text
      : 'No response from AI.';
    res.json({ result: aiText });
  } catch (err) {
    console.error('AI service error:', err);
    if (err.response) {
      console.error('AI API response:', err.response.data);
    }
    res.status(500).json({ message: 'AI service error', error: err.message });
  }
}; 