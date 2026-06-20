import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { colors, space } from '@/constants/theme';
import { sprintResult } from '@/domain/sprint';
import { uiCopy } from '@/i18n/copy';
import { useApp } from '@/state/app-provider';

export default function ResultsScreen() {
  const router = useRouter();
  const { session, data, clearSession } = useApp();
  if (!session?.completed) return <Redirect href="/home" />;
  const result = sprintResult(session);
  const language = data.settings.uiLanguage;
  const copy = uiCopy[language].results;

  const goHome = () => {
    clearSession();
    router.replace('/home');
  };

  return (
    <Screen>
      <View style={styles.confetti}><Text style={styles.confettiText}>◆  ·  ✦  ·  ◆</Text></View>
      <Text style={styles.eyebrow}>{copy.complete}</Text>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{result.uniqueWords}{copy.completed}</Text>

      <View style={styles.scoreCircle}>
        <Text style={styles.score}>{result.accuracy}</Text><Text style={styles.percent}>%</Text>
        <Text style={styles.scoreLabel}>{copy.accuracy}</Text>
      </View>

      <View style={styles.statRow}>
        <Card style={styles.statCard}><Text style={styles.statValue}>{result.correct}</Text><Text style={styles.statLabel}>{copy.firstCorrect}</Text></Card>
        <Card style={styles.statCard}><Text style={[styles.statValue, result.incorrectWordIds.length > 0 && styles.wrongValue]}>{result.incorrectWordIds.length}</Text><Text style={styles.statLabel}>{copy.needsReview}</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statValue}>+{result.xp}</Text><Text style={styles.statLabel}>XP</Text></Card>
      </View>

      <Card style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>{copy.todayGoal}</Text>
          <Text style={styles.goalCount}>{Math.min(data.stats.studiedToday, data.settings.dailyGoal)} / {data.settings.dailyGoal} {copy.words}</Text>
        </View>
        <ProgressBar value={data.stats.studiedToday / data.settings.dailyGoal} />
        <Text style={styles.goalNote}>{data.stats.studiedToday >= data.settings.dailyGoal ? (language === 'ja' ? `${copy.consecutive}${data.stats.streak}${copy.streakGoal}` : `${data.stats.streak}${copy.streakGoal}`) : copy.almost}</Text>
      </Card>

      <View style={styles.actions}>
        {result.incorrectWordIds.length > 0 ? <Button label={language === 'ja' ? `間違えた${result.incorrectWordIds.length}語を確認` : `Review ${result.incorrectWordIds.length} missed words`} onPress={() => router.replace('/review')} /> : null}
        <Button label={copy.home} variant={result.incorrectWordIds.length > 0 ? 'secondary' : 'primary'} onPress={goHome} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  confetti: { alignItems: 'center', marginTop: space.lg },
  confettiText: { color: colors.limeDark, fontSize: 25, letterSpacing: 8 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textAlign: 'center', marginTop: space.md },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900', textAlign: 'center', letterSpacing: -1, marginTop: space.sm },
  subtitle: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: space.sm },
  scoreCircle: { width: 158, height: 158, borderRadius: 79, borderWidth: 13, borderColor: colors.lime, backgroundColor: colors.surface, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginVertical: space.xl },
  score: { color: colors.ink, fontSize: 48, fontWeight: '900', letterSpacing: -2 },
  percent: { color: colors.primary, fontSize: 18, fontWeight: '900', marginTop: 12 },
  scoreLabel: { position: 'absolute', bottom: 27, color: colors.muted, fontSize: 10, fontWeight: '700' },
  statRow: { flexDirection: 'row', gap: space.sm },
  statCard: { flex: 1, padding: space.md, alignItems: 'center' },
  statValue: { color: colors.primary, fontSize: 23, fontWeight: '900' },
  wrongValue: { color: colors.danger },
  statLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', marginTop: 3 },
  goalCard: { marginTop: space.lg, backgroundColor: colors.primarySoft, borderColor: '#C2E4D7' },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.md },
  goalTitle: { color: colors.ink, fontWeight: '900' },
  goalCount: { color: colors.primary, fontWeight: '900' },
  goalNote: { color: colors.primaryDark, fontSize: 12, fontWeight: '600', marginTop: space.sm },
  actions: { gap: space.sm, marginTop: space.lg },
});
