// To use this LLMService with Google Gemini via the official Google Generative AI Node.js client:
// 1. Install packages:
//    npm install @google/generative-ai dotenv
// 2. Create a .env file in your project root.
// 3. Add your GOOGLE_API_KEY to the .env file.

export class LLMService {
  private apiKey: string = 'AIzaSyB5c1j12FEGYeY9XI88hKf43MhNtActhvs';
  private modelName: string = 'gemini-2.5-pro-latest';
  private genAI: any;
  private model: any;

  async init() {
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
    if (!this.apiKey) {
      throw new Error("VITE_GOOGLE_API_KEY is not set in the environment variables.");
    }
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: this.modelName });
  }

  constructor() {
    this.init();
  }

  async generateResponse(userInput: string): Promise<string> {
    try {
      const prompt = `
        A user has communicated the following using sign language: "${userInput}"
        
        Generate a friendly, concise response optimized for sign language conversion:
        - Maximum 2-3 sentences
        - Use simple, clear vocabulary
        - Avoid complex grammar structures
        - Be helpful and encouraging
        - Consider the visual nature of sign language communication
      `;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      if (text) {
        return text.trim();
      } else {
        console.error('Google Gemini API error: No text in response', response);
        return "Sorry, I couldn't generate a response.";
      }
    } catch (error: any) {
      console.error('Google Gemini API error:', error.message || error);
      return "I'm having trouble understanding right now. Can you try again?";
    }
  }
}

export const llmService = new LLMService();

