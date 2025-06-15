export { featureTemplate } from './feature';
export { bugTemplate } from './bug';
export { epicTemplate } from './epic';
export { technicalDebtTemplate } from './technical-debt';

import { IssueFormData } from '@/lib/types/issue';
import { featureTemplate } from './feature';
import { bugTemplate } from './bug';
import { epicTemplate } from './epic';
import { technicalDebtTemplate } from './technical-debt';

export const getTemplate = (data: IssueFormData): string => {
  switch (data.type) {
    case 'feature':
      return featureTemplate(data);
    case 'bug':
      return bugTemplate(data);
    case 'epic':
      return epicTemplate(data);
    case 'technical-debt':
      return technicalDebtTemplate(data);
    default:
      throw new Error(`Unknown issue type: ${data.type}`);
  }
};