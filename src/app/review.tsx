import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vocabularyById } from '@/content/catalog';
import { BottomNav } from '@/components/ui/bottom-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { colors, radii, space } from '@/constants/theme';
import { masteryLevel } from '@/domain/scheduler';
import { sprintResult } from '@/domain/sprint';
import { uiCopy, type UiLanguage } from '@/i18n/copy';
import { useApp } from '@/state/app-provider';

function dueLabel(dueAt: string, language: UiLanguage) {
  const copy = uiCopy[language].review;
  const due = new Date(dueAt);
  const today = new Date();
  if (due.getTime() <= today.getTime()) return copy.today;
  const days = Math.max(1, Math.ceil((due.getTime() - today.getTime()) / 86_400_000));
  return language === 'ja' ? `${days}${copy.daysLater}` : `${days} ${copy.daysLater}`;
}

export default function ReviewScreen() {
  const router = useRouter();
  const { data, session, startSprint } = useApp();
  const language = data.settings.uiLanguage;
  const copy = uiCopy[language].review;
  const latestIncorrect = session?.completed ? new Set(sprintResult(session).incorrectWordIds) : new Set<string>();
  const entries = Object.values(data.reviews)
    .sort((a, b) => {
      const latestDifference = Number(latestIncorrect.has(b.wordId)) - Number(latestIncorrect.has(a.wordId));
      return latestDifference || a.dueAt.localeCompare(b.dueAt);
    })
    .map((review) => ({ review, word: vocabularyById.get(review.wordId) }))
    .filter((item): item is { review: typeof item.review; word: NonNullable<typeof item.word> } => Boolean(item.word));

  const beginReview = () => {
    const next = startSprint('review');
    if (next.queue.length > 0) router.push('/sprint');
  };

  return (
    <Screen footer={<BottomNav />}>
      <Text style={styles.eyebrow}>REVIEW</Text>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      {latestIncorrect.size > 0 ? (
        <Card style={styles.alertCard}>
          <View style={styles.alertIcon}><Text style={styles.alertIconText}>!</Text></View>
          <View style={styles.alertCopy}><Text style={styles.alertTitle}>{copy.latestMistakes} {latestIncorrect.size} {copy.words}</Text><Text style={styles.alertMeta}>{copy.repeated}</Text></View>
        </Card>
      ) : null}

      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{copy.learning}</Text>
        <Text style={styles.count}>{entries.length} {copy.words}</Text>
      </View>

      {entries.length === 0 ? (
        <Card style={styles.empty}>
          <Text style={styles.emptyIcon}>↻</Text>
          <Text style={styles.emptyTitle}>{copy.empty}</Text>
          <Text style={styles.emptyMeta}>{copy.emptyHelp}</Text>
          <Button label={copy.startHome} onPress={() => router.replace('/home')} style={styles.emptyButton} />
        </Card>
      ) : (
        <View style={styles.list}>
          {entries.map(({ review, word }) => {
            const level = masteryLevel(review);
            const isLatestMiss = latestIncorrect.has(word.id);
            return (
              <Pressable key={word.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/vocabulary/[id]', params: { id: word.id } })}>
                {({ pressed }) => (
                  <Card style={[styles.wordCard, pressed ? styles.pressed : {}]}>
                    <View style={styles.wordCopy}>
                      <View style={styles.termRow}>
                        <Text style={styles.term}>{word.term}</Text>
                        {isLatestMiss ? <Text style={styles.missBadge}>{copy.check}</Text> : null}
                      </View>
                      <Text style={styles.meaning}>{word.meaningJa}</Text>
                      <Text style={styles.category}>{word.category}</Text>
                    </View>
                    <View style={styles.wordMeta}>
                      <Text style={[styles.due, review.dueAt <= new Date().toISOString() && styles.dueNow]}>{dueLabel(review.dueAt, language)}</Text>
                      <View style={styles.dots}>{[1, 2, 3].map((dot) => <View key={dot} style={[styles.dot, dot <= level && styles.dotActive]} />)}</View>
                      <Text style={styles.arrow}>›</Text>
                    </View>
                  </Card>
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {entries.length > 0 ? <Button label={copy.start} onPress={beginReview} style={styles.reviewButton} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginTop: space.sm },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -1, marginTop: space.xs },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: space.sm },
  alertCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.dangerSoft, borderColor: '#F0C6C2', padding: space.md, gap: space.md, marginTop: space.lg },
  alertIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  alertIconText: { color: colors.white, fontSize: 20, fontWeight: '900' },
  alertCopy: { flex: 1 },
  alertTitle: { color: colors.danger, fontWeight: '900' },
  alertMeta: { color: colors.muted, fontSize: 11, marginTop: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: space.xl, marginBottom: space.sm },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  count: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  list: { gap: space.sm },
  wordCard: { flexDirection: 'row', alignItems: 'center', padding: space.md },
  wordCopy: { flex: 1 },
  termRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  term: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  missBadge: { color: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3, fontSize: 9, fontWeight: '900' },
  meaning: { color: colors.ink, fontSize: 13, fontWeight: '600', marginTop: 3 },
  category: { color: colors.muted, fontSize: 10, marginTop: 4 },
  wordMeta: { alignItems: 'flex-end', gap: space.xs },
  due: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  dueNow: { color: colors.amber },
  dots: { flexDirection: 'row', gap: 3 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.line },
  dotActive: { backgroundColor: colors.primary },
  arrow: { color: colors.muted, position: 'absolute', right: -4, bottom: -2, fontSize: 18 },
  pressed: { opacity: 0.7 },
  reviewButton: { marginTop: space.lg },
  empty: { alignItems: 'center', paddingVertical: space.xl },
  emptyIcon: { color: colors.primary, fontSize: 35, fontWeight: '900' },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', marginTop: space.md },
  emptyMeta: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: space.sm },
  emptyButton: { marginTop: space.lg, alignSelf: 'stretch' },
});
