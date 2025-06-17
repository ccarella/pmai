import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { userProfiles } from '@/lib/services/user-storage';

const RATE_LIMIT_REQUESTS_PER_HOUR = parseInt(process.env.RATE_LIMIT_REQUESTS_PER_HOUR || '20');
const RATE_LIMIT_MAX_TOKENS_PER_REQUEST = parseInt(process.env.RATE_LIMIT_MAX_TOKENS_PER_REQUEST || '2000');
const MAX_MONTHLY_COST_USD = parseFloat(process.env.MAX_MONTHLY_COST_USD || '10');

const rateLimit = new Map<string, { count: number; resetTime: number }>();
let monthlyUsage = { tokens: 0, cost: 0, resetDate: new Date() };

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimit.get(ip);
  
  if (!limit || now > limit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + 3600000 }); // 1 hour
    return true;
  }
  
  if (limit.count >= RATE_LIMIT_REQUESTS_PER_HOUR) {
    return false;
  }
  
  limit.count++;
  return true;
}

function updateMonthlyUsage(tokens: number, cost: number) {
  const now = new Date();
  if (now.getMonth() !== monthlyUsage.resetDate.getMonth()) {
    monthlyUsage = { tokens: 0, cost: 0, resetDate: now };
  }
  monthlyUsage.tokens += tokens;
  monthlyUsage.cost += cost;
}

function checkCostLimit(): boolean {
  return monthlyUsage.cost < MAX_MONTHLY_COST_USD;
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // Get user-specific API key
    let apiKey: string | null = null;
    if (userId) {
      apiKey = await userProfiles.getOpenAIKey(userId);
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key required',
          message: 'Please configure your OpenAI API key in Settings to use issue generation.',
          requiresApiKey: true,
        },
        { status: 403 }
      );
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    if (!checkCostLimit()) {
      return NextResponse.json(
        { error: 'Monthly cost limit reached' },
        { status: 429 }
      );
    }

    const { title, description } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const prompt = `# Transform User Input into Claude Code-Optimized GitHub Issue

You are an expert at creating clear, actionable GitHub issues specifically formatted to work effectively with Claude Code. Your task is to transform raw user input into a well-structured issue that Claude Code can execute successfully.

## User Input
**Issue Title**: ${title}
**Description**: ${description}

## Your Task
Transform the above into a comprehensive GitHub issue following the template below. Extract all relevant details from the user's description and structure them for maximum clarity and actionability.

## GitHub Issue Template

### Title
[Use the provided title or create a concise, action-oriented title starting with a verb]

### Overview
[Provide a clear, 2-3 sentence summary of what needs to be accomplished]

### Context
[Extract and organize any background information, current state, or problem description from the user's input]

### Requirements
[List specific, actionable requirements extracted or inferred from the description]
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3
[Add more as needed]

### Technical Specifications
[Include any technical details mentioned or reasonably inferred]
- **Framework**: [NextJS/React/etc. if mentioned]
- **UI Library**: [shadcn/ui, Tailwind, etc. if mentioned]
- **Key Dependencies**: [List any mentioned libraries or tools]
- **API Endpoints**: [If relevant]
- **Data Structures**: [If relevant]

### Implementation Guide
[Provide a step-by-step approach for Claude Code]
1. [First logical step]
2. [Second step]
3. [Continue with clear, sequential steps]

### Acceptance Criteria
[Define clear, testable criteria for completion]
- [ ] [Specific, measurable outcome 1]
- [ ] [Specific, measurable outcome 2]
- [ ] [User-facing feature or behavior]
- [ ] All tests pass
- [ ] Code follows project conventions

### Code Structure
\`\`\`
[Suggest file structure if relevant]
/components/[ComponentName].tsx
/lib/[utility].ts
/app/[route]/page.tsx
\`\`\`

### Example Usage
[If applicable, provide a usage example or user flow]
\`\`\`typescript
// Example code snippet or usage pattern
\`\`\`

### Additional Notes
[Include any constraints, design preferences, or special considerations]
- Design should follow modern minimalist principles
- Ensure accessibility compliance
- [Other relevant notes from the description]

### Definition of Done
- [ ] Feature is fully implemented and functional
- [ ] Code is clean, commented, and follows best practices
- [ ] Tests are written and passing
- [ ] Documentation is updated if needed
- [ ] Feature works in development environment

---
*This issue is formatted for optimal use with Claude Code. Each section provides clear context and actionable steps for implementation.*

## Formatting Guidelines

When creating the issue:

1. **Be Specific**: Transform vague requests into concrete, actionable tasks
2. **Add Structure**: Even if the user provides a stream of consciousness, organize it logically
3. **Infer Smartly**: If the user mentions they're building a "form", infer they'll need validation, error handling, and success states
4. **Technical Context**: If they mention specific technologies (NextJS, Vercel, etc.), incorporate relevant best practices
5. **Claude Code Optimization**: 
   - Use clear, imperative language
   - Break complex tasks into steps
   - Provide file paths and structure
   - Include example code when helpful
   - Make acceptance criteria testable

Remember: The goal is to create an issue so clear and comprehensive that Claude Code can implement it successfully without needing clarification.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating comprehensive, actionable GitHub issues. Generate only the GitHub issue content without any additional commentary.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: RATE_LIMIT_MAX_TOKENS_PER_REQUEST,
      temperature: 0.7,
    });

    const generatedIssue = completion.choices[0].message.content || '';
    const usage = completion.usage;

    if (usage) {
      const estimatedCost = (usage.prompt_tokens * 0.00003) + (usage.completion_tokens * 0.00006);
      updateMonthlyUsage(usage.total_tokens, estimatedCost);
    }

    return NextResponse.json({
      issue: generatedIssue,
      usage: usage ? {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      } : undefined
    });

  } catch (error) {
    console.error('Error generating issue:', error);
    return NextResponse.json(
      { error: 'Failed to generate issue' },
      { status: 500 }
    );
  }
}