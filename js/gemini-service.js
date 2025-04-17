class GeminiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.availableModels = null;
  }

  async initialize() {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`);
      this.availableModels = await response.json();
      console.log("Available models:", this.availableModels);
    } catch (error) {
      console.error("Error fetching available models:", error);
      throw error;
    }
  }

  async generateContent(prompt) {
    if (!this.availableModels) {
      await this.initialize();
    }

    // Try different model endpoints
    const modelEndpoints = [
      'gemini-1.5-pro-latest',
      'gemini-pro',
      'models/gemini-pro'
    ];

    for (const model of modelEndpoints) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          return data.candidates[0].content.parts[0].text;
        }
      } catch (error) {
        console.warn(`Failed with model ${model}:`, error);
      }
    }

    throw new Error("All model endpoints failed");
  }

  async generateAdCampaign(productDetails) {
    try {
      const prompt = this.createAdPrompt(productDetails);
      return await this.generateContent(prompt);
    } catch (error) {
      console.error('Error generating ad campaign:', error);
      throw error;
    }
  }

  createAdPrompt(productDetails) {
    return `
      You are an expert marketing AI assistant. Create a comprehensive ad campaign for a product with these details:
      
      Product Name: ${productDetails.productName}
      Category: ${productDetails.productCategory}
      Brand Tone: ${productDetails.brandTone}
      Description: ${productDetails.productDescription}
      
      Generate the following sections with markdown formatting (include ### before each section name):
      
      ### Social Media Posts
      3 creative social media post ideas (each 1-2 sentences) that match the brand tone
      
      ### Ad Captions
      5 attention-grabbing ad captions (each 1 sentence) that would work for Instagram or Facebook ads
      
      ### Email Campaign
      A complete email campaign with:
      - Subject line
      - Preheader text
      - Email body (3-4 paragraphs with a friendly, engaging tone)
      - Call-to-action
      
      ### Banner Concepts
      3 banner ad concepts with visual descriptions including:
      - Color scheme recommendations
      - Key visual elements
      - Suggested layout
      
      Format the response with clear section headings and bullet points where appropriate.
      The tone should be ${productDetails.brandTone} throughout.
    `;
  }
}