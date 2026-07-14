import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { grammarLessonById } from '@/content/grammar-catalog';
import { colors, radii, space } from '@/constants/theme';
import { canAccessGrammarLesson } from '@/domain/access';
import { useApp } from '@/state/app-provider';
import { usePurchases } from '@/state/purchase-provider';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function GrammarLessonScreen() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId?: string }>();
  const { data } = useApp();
  const { isPro } = usePurchases();
  const ja = data.settings.uiLanguage === 'ja';
  const lesson = typeof lessonId === 'string' ? grammarLessonById.get(lessonId) : undefined;
  const [phase, setPhase] = useState<'learn' | 'quiz' | 'result'>('learn');
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  if (!lesson) return <Screen><Text style={styles.error}>{ja ? 'レッスンが見つかりません。' : 'Lesson not found.'}</Text><Button label={ja ? '文法一覧へ' : 'Back'} onPress={() => router.replace('/grammar')} /></Screen>;

  if (!canAccessGrammarLesson(lesson.number, isPro)) return (
    <Screen contentStyle={styles.result}>
      <Text style={styles.eyebrow}>PRO LESSON</Text>
      <Text style={styles.title}>{ja ? 'この文法レッスンはProです' : 'This grammar lesson requires Pro'}</Text>
      <Text style={styles.resultMessage}>{ja ? '最初の3レッスンは無料で利用できます。Proではすべての文法レッスンを学習できます。' : 'The first 3 lessons are free. Pro unlocks every grammar lesson.'}</Text>
      <Button label={ja ? 'Proプランを見る' : 'View Pro plans'} onPress={() => router.replace('/pro')} style={styles.full} />
      <Button label={ja ? '文法一覧へ' : 'Back to grammar'} variant="secondary" onPress={() => router.replace('/grammar')} style={styles.full} />
    </Screen>
  );

  if (phase === 'learn') return (
    <Screen>
      <View style={styles.header}><Pressable onPress={() => router.replace('/grammar')} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable><Text style={styles.headerTitle}>{ja ? lesson.titleJa : lesson.titleEn}</Text><View style={styles.close} /></View>
      <Text style={styles.eyebrow}>LESSON {lesson.number}</Text>
      <Text style={styles.title}>{ja ? lesson.titleJa : lesson.titleEn}</Text>
      <Text style={styles.summary}>{lesson.summaryJa}</Text>
      <Card style={styles.ruleCard}><Text style={styles.ruleLabel}>{ja ? 'ポイント' : 'Key rule'}</Text><Text style={styles.rule}>{lesson.ruleJa}</Text></Card>
      <Text style={styles.sectionTitle}>{ja ? '例文' : 'Examples'}</Text>
      <View style={styles.examples}>{lesson.examples.map((example) => <Card key={example.en} style={styles.example}><Text style={styles.exampleEn}>{example.en}</Text><Text style={styles.exampleJa}>{example.ja}</Text></Card>)}</View>
      <Text style={styles.source}>{lesson.sourceLocator}</Text>
      <Button label={ja ? '練習問題へ  →' : 'Start practice  →'} onPress={() => setPhase('quiz')} style={styles.action} />
    </Screen>
  );

  if (phase === 'result') return (
    <Screen contentStyle={styles.result}>
      <Text style={styles.eyebrow}>LESSON COMPLETE</Text><Text style={styles.title}>{ja ? '練習結果' : 'Practice result'}</Text>
      <View style={styles.scoreCircle}><Text style={styles.score}>{score}</Text><Text style={styles.scoreTotal}>/{lesson.questions.length}</Text></View>
      <Text style={styles.resultMessage}>{score === lesson.questions.length ? (ja ? '全問正解です！' : 'Perfect score!') : (ja ? '間違えたポイントをもう一度確認しましょう。' : 'Review the rule and try again.')}</Text>
      <Button label={ja ? 'もう一度' : 'Try again'} onPress={() => { setCursor(0); setSelected(null); setScore(0); setPhase('quiz'); }} style={styles.full} />
      <Button label={ja ? '文法一覧へ' : 'Back to grammar'} variant="secondary" onPress={() => router.replace('/grammar')} style={styles.full} />
    </Screen>
  );

  const question = lesson.questions[cursor];
  const answered = selected !== null;
  const correct = selected === question.correctIndex;
  const next = () => {
    if (selected === null) return;
    if (cursor === lesson.questions.length - 1) setPhase('result');
    else { setCursor((value) => value + 1); setSelected(null); }
  };
  return (
    <Screen>
      <View style={styles.header}><Pressable onPress={() => router.replace('/grammar')} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable><Text style={styles.headerTitle}>{ja ? lesson.titleJa : lesson.titleEn}</Text><Text style={styles.counter}>{cursor + 1}/{lesson.questions.length}</Text></View>
      <ProgressBar value={(cursor + 1) / lesson.questions.length} />
      <Text style={styles.prompt}>{question.prompt}</Text>
      <View style={styles.choices}>{question.options.map((option, index) => {
        const isCorrect = answered && index === question.correctIndex;
        const isWrong = answered && index === selected && !correct;
        return <Pressable key={option} disabled={answered} onPress={() => { setSelected(index); if (index === question.correctIndex) setScore((value) => value + 1); void Haptics.selectionAsync().catch(() => undefined); }} style={[styles.choice, isCorrect && styles.correctChoice, isWrong && styles.wrongChoice]}><View style={[styles.letter, isCorrect && styles.correctLetter, isWrong && styles.wrongLetter]}><Text style={[styles.letterText, (isCorrect || isWrong) && styles.activeLetter]}>{LETTERS[index]}</Text></View><Text style={styles.choiceText}>{option}</Text></Pressable>;
      })}</View>
      {answered ? <Card style={[styles.feedback, correct ? styles.correctFeedback : styles.wrongFeedback]}><Text style={[styles.feedbackTitle, { color: correct ? colors.success : colors.danger }]}>{correct ? (ja ? '正解！' : 'Correct!') : (ja ? 'もう一度確認' : 'Review this point')}</Text><Text style={styles.explanation}>{question.explanationJa}</Text></Card> : null}
      <Button disabled={!answered} label={cursor === lesson.questions.length - 1 ? (ja ? '結果を見る' : 'View result') : (ja ? '次の問題' : 'Next question')} onPress={next} style={styles.action} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.lg }, close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }, closeText: { color: colors.ink, fontSize: 26 }, headerTitle: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '900', textAlign: 'center' }, counter: { width: 40, color: colors.primary, fontSize: 11, fontWeight: '900', textAlign: 'right' },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.3, marginTop: space.lg }, title: { color: colors.ink, fontSize: 29, lineHeight: 37, fontWeight: '900', marginTop: space.sm }, summary: { color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: space.sm },
  ruleCard: { backgroundColor: colors.primarySoft, borderColor: '#BFDCD5', marginTop: space.xl }, ruleLabel: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1 }, rule: { color: colors.ink, fontSize: 15, lineHeight: 25, fontWeight: '600', marginTop: space.sm }, sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', marginTop: space.xl, marginBottom: space.sm }, examples: { gap: space.sm }, example: { padding: space.md }, exampleEn: { color: colors.ink, fontSize: 16, lineHeight: 23, fontWeight: '800' }, exampleJa: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: space.xs }, source: { color: colors.muted, fontSize: 10, marginTop: space.lg },
  prompt: { color: colors.ink, fontSize: 22, lineHeight: 33, fontWeight: '900', marginTop: space.xxl, marginBottom: space.xl }, choices: { gap: space.sm }, choice: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line, borderRadius: radii.md }, letter: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }, letterText: { color: colors.muted, fontSize: 13, fontWeight: '900' }, activeLetter: { color: colors.white }, choiceText: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: '700' }, correctChoice: { borderColor: colors.success, backgroundColor: colors.successSoft }, wrongChoice: { borderColor: colors.danger, backgroundColor: colors.dangerSoft }, correctLetter: { backgroundColor: colors.success }, wrongLetter: { backgroundColor: colors.danger },
  feedback: { marginTop: space.lg }, correctFeedback: { backgroundColor: colors.successSoft }, wrongFeedback: { backgroundColor: colors.dangerSoft }, feedbackTitle: { fontSize: 16, fontWeight: '900' }, explanation: { color: colors.ink, fontSize: 13, lineHeight: 21, marginTop: space.xs }, action: { marginTop: space.xl },
  result: { alignItems: 'center' }, scoreCircle: { width: 160, height: 160, borderRadius: 80, borderWidth: 12, borderColor: colors.lime, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginVertical: space.xxl }, score: { color: colors.ink, fontSize: 50, fontWeight: '900' }, scoreTotal: { color: colors.muted, fontSize: 18, fontWeight: '800', marginTop: 18 }, resultMessage: { color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: space.lg }, full: { width: '100%', marginTop: space.sm }, error: { color: colors.danger, marginVertical: space.xl },
});
