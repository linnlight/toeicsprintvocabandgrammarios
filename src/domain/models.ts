export type SourceType = 'supplied_pdf' | 'spreadsheet' | 'ai_generated' | 'editorial';

export type ContentType = 'source_term' | 'editorial_translation' | 'ai_assisted_learning';

export interface ContentSource {
  id: string;
  title: string;
  type: SourceType;
  fileName: string;
  note?: string;
}

export interface VocabularyEntry {
  id: string;
  term: string;
  pronunciation: string;
  partOfSpeech: string;
  meaningJa: string;
  category: string;
  level: number;
  example: string;
  exampleJa: string;
  explanationJa: string;
  distractors: string[];
  sourceId: string;
  sourceLocator: string;
  contentTypes: ContentType[];
}

export interface UserSettings {
  currentScore: number;
  targetScore: number;
  dailyGoal: number;
  onboardingComplete: boolean;
  uiLanguage: 'ja' | 'en';
}

export interface ReviewRecord {
  wordId: string;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  dueAt: string;
  lastReviewedAt: string;
  correctCount: number;
  incorrectCount: number;
}

export interface StudyStats {
  totalAnswers: number;
  correctAnswers: number;
  completedSprints: number;
  streak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  studiedToday: number;
  studiedTodayDate: string | null;
}

export interface AnswerEvent {
  wordId: string;
  selectedMeaning: string;
  correct: boolean;
  answeredAt: string;
  isRepeat: boolean;
}

export interface SprintSession {
  id: string;
  startedAt: string;
  targetCount: number;
  queue: string[];
  initialWordIds: string[];
  cursor: number;
  answers: AnswerEvent[];
  repeatedWordIds: string[];
  completed: boolean;
}

export interface PersistedAppState {
  version: 1;
  settings: UserSettings;
  reviews: Record<string, ReviewRecord>;
  stats: StudyStats;
}

export interface SprintResult {
  uniqueWords: number;
  answers: number;
  correct: number;
  accuracy: number;
  incorrectWordIds: string[];
  xp: number;
}
