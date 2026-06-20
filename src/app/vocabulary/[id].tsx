import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { sourceById, vocabularyById } from '@/content/catalog';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { colors, radii, space } from '@/constants/theme';
import { masteryLevel } from '@/domain/scheduler';
import { uiCopy } from '@/i18n/copy';
import { useApp } from '@/state/app-provider';

export function generateStaticParams() {
  return [...vocabularyById.keys()].map((id) => ({ id }));
}

export default function VocabularyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useApp();
  const language = data.settings.uiLanguage;
  const copy = uiCopy[language].detail;
  const word = vocabularyById.get(id);
  if (!word) return <Redirect href="/review" />;
  const source = sourceById.get(word.sourceId);
  const review = data.reviews[word.id];
  const level = masteryLevel(review);

  const speak = () => {
    Speech.stop();
    Speech.speak(word.term, { language: 'en-US', rate: 0.82 });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={copy.back} onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
        <Text style={styles.headerTitle}>{copy.title}</Text>
        <View style={styles.back} />
      </View>

      <Card style={styles.hero}>
        <Text style={styles.category}>{word.category}</Text>
        <View style={styles.wordRow}>
          <View style={styles.wordCopy}>
            <Text style={styles.term}>{word.term}</Text>
            <Text style={styles.pronunciation}>{word.pronunciation} · {word.partOfSpeech}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={copy.listen} onPress={speak} style={styles.speaker}><Text style={styles.speakerText}>♪</Text></Pressable>
        </View>
        <Text style={styles.meaning}>{word.meaningJa}</Text>
      </Card>

      <Text style={styles.sectionTitle}>{copy.example}</Text>
      <Card>
        <Text style={styles.example}>{word.example}</Text>
        <Text style={styles.exampleJa}>{word.exampleJa}</Text>
      </Card>

      <Text style={styles.sectionTitle}>{copy.tip}</Text>
      <Card style={styles.tipCard}><Text style={styles.tipText}>{word.explanationJa}</Text></Card>

      <Text style={styles.sectionTitle}>{copy.status}</Text>
      <Card>
        <View style={styles.statusRow}><Text style={styles.statusLabel}>{copy.mastery}</Text><View style={styles.dots}>{[1, 2, 3].map((dot) => <View key={dot} style={[styles.dot, dot <= level && styles.dotActive]} />)}</View></View>
        <View style={styles.divider} />
        <View style={styles.statusRow}><Text style={styles.statusLabel}>{copy.correctWrong}</Text><Text style={styles.statusValue}>{review?.correctCount ?? 0} / {review?.incorrectCount ?? 0}</Text></View>
        <View style={styles.divider} />
        <View style={styles.statusRow}><Text style={styles.statusLabel}>{copy.nextReview}</Text><Text style={styles.statusValue}>{review ? new Date(review.dueAt).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US') : copy.notStudied}</Text></View>
      </Card>

      <Text style={styles.sourceTitle}>{copy.content}</Text>
      <Text style={styles.sourceText}>{source?.title ?? word.sourceId} · {word.sourceLocator}</Text>
      <Text style={styles.sourceText}>{copy.provenance}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.ink, fontSize: 31, lineHeight: 32 },
  headerTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  hero: { backgroundColor: colors.primary, borderColor: colors.primary },
  category: { alignSelf: 'flex-start', color: colors.primaryDark, backgroundColor: colors.lime, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, fontSize: 10, fontWeight: '900' },
  wordRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.lg },
  wordCopy: { flex: 1 },
  term: { color: colors.white, fontSize: 36, fontWeight: '900', letterSpacing: -1.2 },
  pronunciation: { color: '#C9E4DD', fontSize: 12, marginTop: space.xs },
  speaker: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#2A8B78', alignItems: 'center', justifyContent: 'center' },
  speakerText: { color: colors.lime, fontSize: 22, fontWeight: '900' },
  meaning: { color: colors.white, fontSize: 20, fontWeight: '800', marginTop: space.lg, paddingTop: space.md, borderTopWidth: 1, borderTopColor: '#4D9D8D' },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', marginTop: space.xl, marginBottom: space.sm },
  example: { color: colors.ink, fontSize: 17, lineHeight: 26, fontWeight: '700' },
  exampleJa: { color: colors.muted, fontSize: 13, lineHeight: 21, marginTop: space.sm },
  tipCard: { backgroundColor: colors.primarySoft, borderColor: '#C2E4D7' },
  tipText: { color: colors.primaryDark, fontSize: 14, lineHeight: 23, fontWeight: '600' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { color: colors.muted, fontSize: 12 },
  statusValue: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.line },
  dotActive: { backgroundColor: colors.primary },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: space.md },
  sourceTitle: { color: colors.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: space.xl },
  sourceText: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
});
