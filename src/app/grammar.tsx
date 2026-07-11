import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BottomNav } from '@/components/ui/bottom-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { grammarLessons, grammarQuestionCount } from '@/content/grammar-catalog';
import { colors, space } from '@/constants/theme';
import { useApp } from '@/state/app-provider';

export default function GrammarScreen() {
  const router = useRouter();
  const { data } = useApp();
  const ja = data.settings.uiLanguage === 'ja';

  return (
    <Screen footer={<BottomNav />}>
      <Text style={styles.eyebrow}>TOEIC GRAMMAR</Text>
      <Text style={styles.title}>{ja ? '文法レッスン' : 'Grammar lessons'}</Text>
      <Text style={styles.subtitle}>{ja ? '短い解説とPart 5形式の練習で、頻出文法を身につけます。' : 'Learn essential grammar with short explanations and Part 5-style practice.'}</Text>
      <Card style={styles.summary}>
        <Text style={styles.summaryNumber}>{grammarLessons.length}</Text>
        <Text style={styles.summaryLabel}>{ja ? `レッスン・全${grammarQuestionCount}問` : `lessons · ${grammarQuestionCount} questions`}</Text>
      </Card>

      <View style={styles.list}>
        {grammarLessons.map((lesson) => (
          <Card key={lesson.id} style={styles.lessonCard}>
            <View style={styles.lessonHeader}>
              <View style={styles.number}><Text style={styles.numberText}>{lesson.number}</Text></View>
              <View style={styles.lessonCopy}>
                <Text style={styles.lessonTitle}>{ja ? lesson.titleJa : lesson.titleEn}</Text>
                <Text style={styles.lessonSummary}>{ja ? lesson.summaryJa : lesson.titleJa}</Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>LEVEL {lesson.level}</Text>
              <Text style={styles.meta}>{lesson.questions.length} {ja ? '問' : 'questions'}</Text>
            </View>
            <Button label={ja ? 'レッスンを始める' : 'Start lesson'} onPress={() => router.push(`/grammar/${lesson.id}`)} />
          </Card>
        ))}
      </View>
      <Text style={styles.source}>{ja ? '提供された文法教材をもとに編集・構成' : 'Edited and structured from the supplied grammar materials'}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginTop: space.sm },
  title: { color: colors.ink, fontSize: 30, fontWeight: '900', letterSpacing: -1, marginTop: space.sm },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: space.sm },
  summary: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, backgroundColor: colors.primarySoft, marginTop: space.lg },
  summaryNumber: { color: colors.primary, fontSize: 30, fontWeight: '900' },
  summaryLabel: { color: colors.primaryDark, fontSize: 13, fontWeight: '800' },
  list: { gap: space.md, marginTop: space.lg },
  lessonCard: { gap: space.md },
  lessonHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  number: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  numberText: { color: colors.white, fontSize: 17, fontWeight: '900' },
  lessonCopy: { flex: 1 },
  lessonTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  lessonSummary: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 3 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  source: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: space.xl },
});
