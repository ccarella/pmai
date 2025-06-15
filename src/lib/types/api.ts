export interface AIEnhancements {
  acceptanceCriteria: string[];
  edgeCases: string[];
  technicalConsiderations: string[];
}

export interface EnhanceRequest {
  prompt: string;
  issueType: string;
}

export interface EnhanceResponse {
  enhancements: AIEnhancements;
  error?: string;
}