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
  remindersEnabled: boolean;
  reminderHour: number;
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

export interface DailyStudyActivity {
  words: number;
  sprints: number;
  answers: number;
  correctAnswers: number;
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
  dailyActivity: Record<string, DailyStudyActivity>;
  lastStreakFreezeMonth: string | null;
}

export interface Part5TestAttempt {
  testId: string;
  attempts: number;
  bestScore: number;
  latestScore: number;
  lastCompletedAt: string;
}

export interface Part5AnswerEvent {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
}

export interface Part5Session {
  testId: string;
  startedAt: string;
  cursor: number;
  answers: Part5AnswerEvent[];
  completed: boolean;
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
  part5Attempts: Record<string, Part5TestAttempt>;
}

export interface SprintResult {
  uniqueWords: number;
  answers: number;
  correct: number;
  accuracy: number;
  incorrectWordIds: string[];
  xp: number;
}
