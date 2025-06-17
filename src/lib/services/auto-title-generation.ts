export interface AutoTitleResult {
  title: string;
  isGenerated: boolean;
  alternatives?: string[];
}

/**
 * Automatically generates a title for an issue based on its content
 * Uses text processing to extract a meaningful title from the content
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

  // Always use text processing for automatic title generation
  // AI title generation is now only available through the API with user-specific keys
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
 * Generate fallback title using text processing
 */
function generateFallbackTitle(content: string): string {
  // Remove common prefixes like Markdown headings or "Title:" labels
  let sanitized = content.trim();
  sanitized = sanitized.replace(/^#+\s*title:?\s*/i, '');
  sanitized = sanitized.replace(/^title:?\s*/i, '');

  // Clean and truncate the content to create a reasonable title
  const cleaned = sanitized
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