
export interface ArticleOutline {
  suggestedTitles: string[];
  structure: OutlineNode[];
  targetWordCount: string;
  imageStrategy: {
    totalImages: number;
    placements: Array<{
      afterSection: string;
      description: string;
      aiPrompt: string;
    }>;
  };
  faqs: Array<{ 
    question: string; 
    answer: string; 
    rationale: string;
  }>;
}

export interface OutlineNode {
  level: 'H2' | 'H3';
  title: string;
  description: string;
  guidelines: string;
  sourceCompetitor?: string;
}

export interface DraftAnalysis {
  score: number;
  missingSections: string[];
  keywordGaps: string[];
  suggestions: string[];
  readabilityFeedback: string;
}

export enum AppStep {
  SETUP,
  ANALYZING,
  OUTLINE_READY,
  EDITOR // 使用者在此輸入內容並查看分析
}
