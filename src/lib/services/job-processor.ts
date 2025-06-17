import { jobQueue, CreateAndPublishIssuePayload, CreateAndPublishIssueResult } from './job-queue';
import { generateAutoTitle } from './auto-title-generation';
import { publishToGitHubWithRetry } from '@/lib/github/publishIssue';
import { githubConnections } from '@/lib/redis';
import { OpenAI } from 'openai';
import { userProfiles } from './user-storage';

export class JobProcessor {
  async processCreateAndPublishIssue(
    jobId: string,
    userId: string,
    payload: CreateAndPublishIssuePayload
  ): Promise<void> {
    try {
      // Update job status to processing
      await jobQueue.updateJobStatus(jobId, 'processing');

      let markdown: string;
      let summary: { type: string; priority: string; complexity: string };

      // Check if content was already generated
      if (payload.generatedContent) {
        // Use pre-generated content
        markdown = payload.generatedContent.markdown;
        summary = payload.generatedContent.summary;
      } else {
        // Generate issue content using AI
        const openAIKey = await userProfiles.getOpenAIKey(userId);
        if (!openAIKey) {
          throw new Error('OpenAI API key not found');
        }

        // Initialize OpenAI client
        const openai = new OpenAI({ apiKey: openAIKey });

        const systemPrompt = `You are an expert at creating comprehensive GitHub issues optimized for AI-assisted development.
Create a detailed issue based on the user's prompt.
Include all sections: Overview, Context, Requirements, Technical Specifications, Implementation Guide, Acceptance Criteria, Additional Notes, and Definition of Done.
Return ONLY valid JSON with the structure: { "markdown": "...", "summary": { "type": "feature|bug|epic|technical-debt", "priority": "high|medium|low", "complexity": "small|medium|large" } }`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: payload.prompt }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) {
          throw new Error('No content generated from AI');
        }

        const issueData = JSON.parse(responseContent);
        markdown = issueData.markdown;
        summary = issueData.summary;

        // Track usage - estimate tokens based on response
        const estimatedTokens = Math.ceil((markdown.length + responseContent.length) / 4);
        const estimatedCost = estimatedTokens * 0.00001; // Rough estimate for gpt-4o-mini
        await userProfiles.updateUsageStats(userId, estimatedTokens, estimatedCost);
      }

      // Generate title
      const titleResult = await generateAutoTitle(markdown, payload.title);
      const finalTitle = titleResult.title;

      // Get GitHub connection
      const connection = await githubConnections.get(userId);
      if (!connection) {
        throw new Error('GitHub not connected');
      }

      // Publish to GitHub
      const publishResult = await publishToGitHubWithRetry({
        title: finalTitle,
        body: markdown,
        labels: [summary.type],
        accessToken: connection.accessToken,
        repository: payload.repository,
      });

      if (!publishResult.success) {
        throw new Error(publishResult.error || 'Failed to publish to GitHub');
      }


      // Update job with success result
      const result: CreateAndPublishIssueResult = {
        issueUrl: publishResult.issueUrl!,
        issueNumber: publishResult.issueNumber!,
        repository: payload.repository,
        title: finalTitle,
      };

      await jobQueue.updateJobStatus(jobId, 'completed', result);
    } catch (error) {
      console.error(`Error processing job ${jobId}:`, error);
      
      // Check if we should retry
      const job = await jobQueue.getJob(jobId);
      if (job && job.retryCount < job.maxRetries) {
        await jobQueue.retryJob(jobId);
      } else {
        await jobQueue.updateJobStatus(
          jobId,
          'failed',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  }

  async processNextJob(): Promise<boolean> {
    const job = await jobQueue.getNextPendingJob();
    if (!job) return false;

    console.log(`Processing job ${job.id} of type ${job.type}`);

    switch (job.type) {
      case 'create-and-publish-issue':
        await this.processCreateAndPublishIssue(
          job.id,
          job.userId,
          job.payload as CreateAndPublishIssuePayload
        );
        break;
      default:
        console.error(`Unknown job type: ${job.type}`);
        await jobQueue.updateJobStatus(job.id, 'failed', undefined, 'Unknown job type');
    }

    return true;
  }

  async processPendingJobs(maxJobs = 10): Promise<number> {
    let processedCount = 0;
    
    for (let i = 0; i < maxJobs; i++) {
      const processed = await this.processNextJob();
      if (!processed) break;
      processedCount++;
    }

    return processedCount;
  }
}

export const jobProcessor = new JobProcessor();