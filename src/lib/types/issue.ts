export type IssueType = 'feature' | 'bug' | 'epic' | 'technical-debt';

export interface IssueFormData {
  type: IssueType;
  title: string;
  description: string;
  context: {
    businessValue: string;
    targetUsers: string;
    successCriteria: string;
  };
  technical: {
    components?: string[];
    stepsToReproduce?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    subFeatures?: string[];
    improvementAreas?: string[];
  };
  implementation: {
    requirements: string;
    dependencies: string[];
    approach: string;
    affectedFiles: string[];
  };
  aiEnhancements?: {
    acceptanceCriteria: string[];
    edgeCases: string[];
    technicalConsiderations: string[];
  };
}