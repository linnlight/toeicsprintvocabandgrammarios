import { useEffect, useMemo, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { part5TestById } from '@/content/part5-catalog';
import { colors, radii, space } from '@/constants/theme';
import { canAccessPart5Test, part5Score } from '@/domain/part5';
import { uiCopy } from '@/i18n/copy';
import { useApp } from '@/state/app-provider';
import { usePurchases } from '@/state/purchase-provider';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function Part5TestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ testId?: string }>();
  const { data, part5Session, startPart5Test, submitPart5Answer, clearPart5Session } = useApp();
  const { isPro } = usePurchases();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const submittingRef = useRef(false);
  const language = data.settings.uiLanguage;
  const copy = uiCopy[language].part5;
  const test = typeof params.testId === 'string' ? part5TestById.get(params.testId) : undefined;
  const available = Boolean(test && canAccessPart5Test(test.number, isPro));

  useEffect(() => {
    if (test && available && part5Session?.testId !== test.id) startPart5Test(test.id);
  }, [available, part5Session?.testId, startPart5Test, test]);

  useEffect(() => {
    submittingRef.current = false;
  }, [part5Session?.cursor]);

  const close = () => {
    const leave = () => {
      clearPart5Session();
      router.replace('/tests');
    };
    if (part5Session?.completed) {
      leave();
      return;
    }
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(language === 'ja' ? 'テストを終了しますか？' : 'End this test?')) leave();
    } else {
      Alert.alert(copy.close, language === 'ja' ? '現在の回答は保存されません。' : 'Your current answers will not be saved.', [
        { text: language === 'ja' ? '続ける' : 'Continue', style: 'cancel' },
        { text: copy.close, style: 'destructive', onPress: leave },
      ]);
    }
  };

  if (!test) {
    return <Screen><Text style={styles.error}>{copy.unavailable}</Text><Button label={copy.backToTests} onPress={() => router.replace('/tests')} /></Screen>;
  }

  if (!available) {
    return (
      <Screen contentStyle={styles.centered}>
        <View style={styles.lockIcon}><Text style={styles.lockText}>PRO</Text></View>
        <Text style={styles.resultTitle}>{copy.proRequired}</Text>
        <Button label={copy.viewPro} onPress={() => router.replace('/pro')} style={styles.fullButton} />
        <Button label={copy.backToTests} onPress={() => router.replace('/tests')} variant="ghost" style={styles.fullButton} />
      </Screen>
    );
  }

  if (!part5Session || part5Session.testId !== test.id) {
    return <Screen contentStyle={styles.centered}><Text style={styles.loading}>{language === 'ja' ? 'テストを準備中…' : 'Preparing test…'}</Text></Screen>;
  }

  if (part5Session.completed) {
    return <Part5Results testId={test.id} onClose={close} />;
  }

  const question = test.questions[part5Session.cursor];
  const isLast = part5Session.cursor === test.questions.length - 1;
  return (
    <Screen>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={copy.close} onPress={close} style={styles.closeButton}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{language === 'ja' ? test.titleJa : test.titleEn}</Text>
        <Text style={styles.counter}>{part5Session.cursor + 1}/{test.questions.length}</Text>
      </View>
      <ProgressBar value={(part5Session.cursor + 1) / test.questions.length} />

      <Text style={styles.questionLabel}>{copy.question} {part5Session.cursor + 1} {copy.of} {test.questions.length}</Text>
      <Text style={styles.instruction}>{copy.choose}</Text>
      <Card style={styles.questionCard}>
        <Text style={styles.prompt}>{question.prompt}</Text>
      </Card>

      <View style={styles.choices}>
        {question.options.map((option, index) => {
          const selected = selectedIndex === index;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={`${question.id}-${LETTERS[index]}`}
              onPress={() => {
                setSelectedIndex(index);
                void Haptics.selectionAsync().catch(() => undefined);
              }}
              style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.choicePressed]}
            >
              <View style={[styles.letter, selected && styles.letterSelected]}><Text style={[styles.letterText, selected && styles.letterTextSelected]}>{LETTERS[index]}</Text></View>
              <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>

      <Button
        disabled={selectedIndex === null}
        label={isLast ? copy.finish : copy.next}
        onPress={() => {
          if (selectedIndex !== null) {
            if (submittingRef.current) return;
            submittingRef.current = true;
            submitPart5Answer(selectedIndex);
            setSelectedIndex(null);
            void Haptics.impactAsync(isLast ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
          }
        }}
        style={styles.nextButton}
      />
    </Screen>
  );
}

function Part5Results({ testId, onClose }: { testId: string; onClose: () => void }) {
  const { data, part5Session, startPart5Test } = useApp();
  const language = data.settings.uiLanguage;
  const copy = uiCopy[language].part5;
  const test = part5TestById.get(testId);
  const result = part5Session ? part5Score(part5Session) : 0;
  const attempt = data.part5Attempts[testId];
  const missed = useMemo(() => {
    if (!test || !part5Session) return [];
    return part5Session.answers.flatMap((answer) => {
      if (answer.correct) return [];
      const question = test.questions.find((candidate) => candidate.id === answer.questionId);
      return question ? [{ answer, question }] : [];
    });
  }, [part5Session, test]);

  if (!test || !part5Session) return null;
  const percent = Math.round((result / test.questions.length) * 100);
  return (
    <Screen>
      <View style={styles.resultHeader}><Text style={styles.complete}>{copy.complete}</Text><Text style={styles.resultTitle}>{copy.resultTitle}</Text></View>
      <View style={styles.scoreCircle}>
        <Text style={styles.score}>{result}</Text><Text style={styles.scoreTotal}>/{test.questions.length}</Text>
        <Text style={styles.scorePercent}>{percent}%</Text>
      </View>
      <View style={styles.resultStats}>
        <Card style={styles.resultStat}><Text style={styles.resultValue}>{result}</Text><Text style={styles.resultLabel}>{copy.correct}</Text></Card>
        <Card style={styles.resultStat}><Text style={styles.resultValue}>{percent}%</Text><Text style={styles.resultLabel}>{copy.accuracy}</Text></Card>
        <Card style={styles.resultStat}><Text style={styles.resultValue}>{attempt?.bestScore ?? result}</Text><Text style={styles.resultLabel}>{copy.newBest}</Text></Card>
      </View>

      <Text style={styles.reviewTitle}>{copy.reviewTitle}</Text>
      {missed.length === 0 ? (
        <Card style={styles.perfectCard}><Text style={styles.perfect}>✓ {copy.allCorrect}</Text></Card>
      ) : (
        <View style={styles.missedList}>
          {missed.map(({ answer, question }) => (
            <Card key={question.id} style={styles.missedCard}>
              <Text style={styles.missedNumber}>Q{question.number}</Text>
              <Text style={styles.missedPrompt}>{question.prompt}</Text>
              <Text style={styles.wrongAnswer}>{copy.yourAnswer}: {LETTERS[answer.selectedIndex]}. {question.options[answer.selectedIndex]}</Text>
              <Text style={styles.correctAnswer}>{copy.correctAnswer}: {LETTERS[question.correctIndex]}. {question.options[question.correctIndex]}</Text>
            </Card>
          ))}
        </View>
      )}

      <Button label={copy.retry} onPress={() => startPart5Test(test.id)} style={styles.resultButton} />
      <Button label={copy.backToTests} onPress={onClose} variant="secondary" style={styles.resultButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm, marginTop: space.sm, marginBottom: space.md },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.ink, fontSize: 25, lineHeight: 27 },
  headerTitle: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '900', textAlign: 'center' },
  counter: { width: 40, color: colors.primary, fontSize: 11, fontWeight: '900', textAlign: 'right' },
  questionLabel: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.1, marginTop: space.xl },
  instruction: { color: colors.muted, fontSize: 12, marginTop: space.xs },
  questionCard: { minHeight: 155, justifyContent: 'center', marginTop: space.lg, padding: space.xl, backgroundColor: colors.surface },
  prompt: { color: colors.ink, fontSize: 20, lineHeight: 30, fontWeight: '800', letterSpacing: -0.2 },
  choices: { gap: space.sm, marginTop: space.lg },
  choice: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingVertical: space.sm, borderWidth: 1.5, borderColor: colors.line, borderRadius: radii.md, backgroundColor: colors.surface },
  choiceSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  choicePressed: { opacity: 0.75 },
  letter: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  letterSelected: { backgroundColor: colors.primary },
  letterText: { color: colors.muted, fontSize: 13, fontWeight: '900' },
  letterTextSelected: { color: colors.white },
  choiceText: { flex: 1, color: colors.ink, fontSize: 15, fontWeight: '700' },
  choiceTextSelected: { color: colors.primaryDark },
  nextButton: { marginTop: space.xl, marginBottom: space.md },
  loading: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 14, marginVertical: space.xl },
  lockIcon: { width: 82, height: 82, borderRadius: 28, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  lockText: { color: colors.lime, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  fullButton: { width: '100%' },
  resultHeader: { alignItems: 'center', marginTop: space.lg },
  complete: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  resultTitle: { color: colors.ink, fontSize: 28, lineHeight: 36, fontWeight: '900', textAlign: 'center', marginTop: space.sm },
  scoreCircle: { width: 164, height: 164, borderRadius: 82, borderWidth: 12, borderColor: colors.lime, backgroundColor: colors.surface, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginVertical: space.xl },
  score: { color: colors.ink, fontSize: 48, fontWeight: '900', letterSpacing: -2 },
  scoreTotal: { color: colors.muted, fontSize: 17, fontWeight: '800', marginTop: 17 },
  scorePercent: { position: 'absolute', bottom: 25, color: colors.primary, fontSize: 11, fontWeight: '900' },
  resultStats: { flexDirection: 'row', gap: space.sm },
  resultStat: { flex: 1, alignItems: 'center', padding: space.md },
  resultValue: { color: colors.primary, fontSize: 21, fontWeight: '900' },
  resultLabel: { color: colors.muted, fontSize: 9, fontWeight: '700', textAlign: 'center', marginTop: 3 },
  reviewTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', marginTop: space.xl, marginBottom: space.sm },
  missedList: { gap: space.sm },
  missedCard: { padding: space.md },
  missedNumber: { color: colors.danger, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  missedPrompt: { color: colors.ink, fontSize: 14, lineHeight: 21, fontWeight: '700', marginTop: space.sm },
  wrongAnswer: { color: colors.danger, fontSize: 11, lineHeight: 17, marginTop: space.md },
  correctAnswer: { color: colors.success, fontSize: 11, lineHeight: 17, fontWeight: '800', marginTop: space.xs },
  perfectCard: { backgroundColor: colors.successSoft, borderColor: '#BFE7CE' },
  perfect: { color: colors.success, fontSize: 14, fontWeight: '900', textAlign: 'center' },
  resultButton: { marginTop: space.md },
});
