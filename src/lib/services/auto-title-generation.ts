import { AIEnhancementService } from './ai-enhancement';

export interface AutoTitleResult {
  title: string;
  isGenerated: boolean;
  alternatives?: string[];
}

/**
 * Automatically generates a title for an issue based on its content
 * Uses AI when available, falls back to text processing when not
 */
export async function generateAutoTitle(
  content: string,
  currentTitle?: string
): Promise<AutoTitleResult> {
  // If a meaningful title is already provided, use it
  if (currentTitle && currentTitle.trim().length > 5 && !isGenericTitle(currentTitle)) {
    return {
      title: currentTitle.trim(),
      isGenerated: false,
    };
  }

  // Try AI generation first
  const aiService = getAIService();
  if (aiService) {
    try {
      const aiResult = await generateTitleWithAI(aiService, content);
      return {
        title: aiResult.title,
        isGenerated: true,
        alternatives: aiResult.alternatives,
      };
    } catch (error) {
      console.warn('AI title generation failed:', error);
      // Fall back to text processing
    }
  }

  // Fallback to text processing
  return {
    title: generateFallbackTitle(content),
    isGenerated: false,
  };
}

/**
 * Check if the current title is generic/placeholder
 */
function isGenericTitle(title: string): boolean {
  const genericTitles = [
    'generated issue',
    'new issue',
    'issue',
    'feature request',
    'bug report',
    'enhancement',
  ];
  
  const normalized = title.toLowerCase().trim();
  return genericTitles.some(generic => normalized === generic || normalized.startsWith(generic));
}

/**
 * Get AI service instance if available
 */
function getAIService(): AIEnhancementService | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new AIEnhancementService(apiKey);
}

/**
 * Generate title using AI
 */
async function generateTitleWithAI(
  service: AIEnhancementService,
  content: string
): Promise<{ title: string; alternatives?: string[] }> {
  const systemPrompt = `You are an expert at creating concise, descriptive GitHub issue titles. Your task is to analyze the user's description and generate a clear, action-oriented title.

Guidelines for good GitHub issue titles:
1. Start with an action verb (Add, Fix, Update, Implement, etc.)
2. Be specific but concise (5-50 characters ideal)
3. Focus on the main objective, not implementation details
4. Use present tense, imperative mood
5. Avoid technical jargon when possible

Examples:
- "Add dark mode toggle to settings"
- "Fix memory leak in image processing"
- "Update user authentication flow"
- "Implement search functionality"

Your response must be in JSON format with these keys:
- title: The main recommended title (string)
- alternatives: Array of 2-3 alternative titles (array of strings)

Make the title clear, actionable, and professional.`;

  const userPrompt = `Please create a GitHub issue title for this description:

${content}

Generate one primary title and 2-3 alternatives that capture the essence of this request.`;

  // Use the existing OpenAI client from the service
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completion = await (service as any).openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3, // Lower temperature for more consistent, focused titles
    max_tokens: 200, // Titles should be short
    response_format: { type: 'json_object' },
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error('No response from AI');
  }

  // Update usage stats manually
  if (completion.usage && (service as any).usage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).usage.totalTokens += completion.usage.total_tokens;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).usage.requestCount += 1;
    // gpt-4-turbo pricing: ~$0.01 per 1K input tokens, $0.03 per 1K output tokens
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).usage.estimatedCost += (completion.usage.total_tokens / 1000) * 0.02;
  }

  const parsed = JSON.parse(response);
  
  // Validate and clean the response
  const title = typeof parsed.title === 'string' ? parsed.title.trim() : generateFallbackTitle(content);
  const alternatives = Array.isArray(parsed.alternatives) 
    ? parsed.alternatives.filter((alt: unknown) => typeof alt === 'string').map((alt: string) => alt.trim())
    : [];

  // Ensure title is within reasonable length
  const finalTitle = title.length > 70 ? title.substring(0, 67) + '...' : title;

  return {
    title: finalTitle,
    alternatives,
  };
}

/**
 * Generate fallback title using text processing
 */
function generateFallbackTitle(content: string): string {
  // Clean and truncate the content to create a reasonable title
  const cleaned = content
    .replace(/[^\w\s]/g, ' ') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Try to extract the first sentence or meaningful phrase
  const sentences = cleaned.split(/[.!?]/);
  const firstSentence = sentences[0]?.trim();
  
  if (firstSentence && firstSentence.length <= 50) {
    return firstSentence;
  }
  
  // If first sentence is too long, take first 50 characters
  const truncated = cleaned.length > 50 ? cleaned.substring(0, 47) + '...' : cleaned;
  
  return truncated || 'Generated Issue';
}