import { useRouter } from 'expo-router';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { vocabulary } from '@/content/catalog';
import { BottomNav } from '@/components/ui/bottom-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { colors, space } from '@/constants/theme';
import { masteryLevel } from '@/domain/scheduler';
import { uiCopy } from '@/i18n/copy';
import { useApp } from '@/state/app-provider';

export default function ProgressScreen() {
  const router = useRouter();
  const { data, resetProgress } = useApp();
  const copy = uiCopy[data.settings.uiLanguage].progress;
  const reviews = Object.values(data.reviews);
  const learned = reviews.length;
  const learning = reviews.filter((review) => masteryLevel(review) === 1).length;
  const familiar = reviews.filter((review) => masteryLevel(review) === 2).length;
  const mastered = reviews.filter((review) => masteryLevel(review) === 3).length;
  const accuracy = data.stats.totalAnswers === 0 ? 0 : Math.round((data.stats.correctAnswers / data.stats.totalAnswers) * 100);

  const doReset = async () => {
    await resetProgress();
    router.replace('/onboarding');
  };
  const confirmReset = () => {
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(copy.resetConfirm)) void doReset();
    } else {
      Alert.alert(copy.resetTitle, copy.resetMessage, [
        { text: copy.cancel, style: 'cancel' },
        { text: copy.delete, style: 'destructive', onPress: () => void doReset() },
      ]);
    }
  };

  return (
    <Screen footer={<BottomNav />}>
      <Text style={styles.eyebrow}>PROGRESS</Text>
      <Text style={styles.title}>{copy.title}</Text>

      <Card style={styles.hero}>
        <View style={styles.scoreCopy}>
          <Text style={styles.scoreLabel}>{copy.scoreTarget}</Text>
          <Text style={styles.scoreValue}>{data.settings.currentScore} <Text style={styles.scoreArrow}>→</Text> {data.settings.targetScore}</Text>
          <Text style={styles.scoreMeta}>{copy.pointsRemaining} {Math.max(0, data.settings.targetScore - data.settings.currentScore)} {copy.points}</Text>
        </View>
        <View style={styles.streakCircle}><Text style={styles.streakValue}>{data.stats.streak}</Text><Text style={styles.streakLabel}>{copy.days}</Text></View>
      </Card>

      <View style={styles.statGrid}>
        <Card style={styles.statCard}><Text style={styles.statValue}>{data.stats.completedSprints}</Text><Text style={styles.statLabel}>{copy.sprints}</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statValue}>{learned}</Text><Text style={styles.statLabel}>{copy.learned}</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statValue}>{accuracy}%</Text><Text style={styles.statLabel}>{copy.accuracy}</Text></Card>
      </View>

      <Text style={styles.sectionTitle}>{copy.mastery}</Text>
      <Card>
        <View style={styles.masteryHeader}><Text style={styles.masteryTotal}>{learned} / {vocabulary.length} {copy.words}</Text><Text style={styles.masteryPercent}>{Math.round((learned / vocabulary.length) * 100)}%</Text></View>
        <ProgressBar value={learned / vocabulary.length} />
        <View style={styles.legend}>
          <View style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: colors.amber }]} /><Text style={styles.legendLabel}>{copy.learning}</Text><Text style={styles.legendValue}>{learning}</Text></View>
          <View style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: colors.primary }]} /><Text style={styles.legendLabel}>{copy.almost}</Text><Text style={styles.legendValue}>{familiar}</Text></View>
          <View style={styles.legendRow}><View style={[styles.legendDot, { backgroundColor: colors.limeDark }]} /><Text style={styles.legendLabel}>{copy.mastered}</Text><Text style={styles.legendValue}>{mastered}</Text></View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>{copy.settings}</Text>
      <Card>
        <View style={styles.settingRow}><Text style={styles.settingLabel}>{copy.dailyGoal}</Text><Text style={styles.settingValue}>{data.settings.dailyGoal} {copy.words}</Text></View>
        <View style={styles.divider} />
        <View style={styles.settingRow}><Text style={styles.settingLabel}>{copy.longest}</Text><Text style={styles.settingValue}>{data.stats.longestStreak} {copy.day}</Text></View>
        <View style={styles.divider} />
        <View style={styles.settingRow}><Text style={styles.settingLabel}>{copy.storage}</Text><Text style={styles.settingValue}>{copy.thisDevice}</Text></View>
      </Card>

      <Button label={copy.reset} variant="danger" onPress={confirmReset} style={styles.reset} />
      <Text style={styles.version}>Vocab Sprint MVP · content schema v1</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginTop: space.sm },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -1, marginTop: space.xs, marginBottom: space.lg },
  hero: { backgroundColor: colors.primary, borderColor: colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreCopy: { flex: 1 },
  scoreLabel: { color: colors.lime, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  scoreValue: { color: colors.white, fontSize: 27, fontWeight: '900', marginTop: space.sm },
  scoreArrow: { color: '#8EC6B9', fontSize: 20 },
  scoreMeta: { color: '#C9E4DD', fontSize: 11, marginTop: space.xs },
  streakCircle: { width: 75, height: 75, borderRadius: 38, borderWidth: 6, borderColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  streakValue: { color: colors.white, fontSize: 25, fontWeight: '900' },
  streakLabel: { color: '#C9E4DD', fontSize: 9, fontWeight: '700' },
  statGrid: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  statCard: { flex: 1, alignItems: 'center', padding: space.md },
  statValue: { color: colors.ink, fontSize: 21, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 9, fontWeight: '700', textAlign: 'center', marginTop: 3 },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginTop: space.xl, marginBottom: space.sm },
  masteryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.sm },
  masteryTotal: { color: colors.ink, fontWeight: '900' },
  masteryPercent: { color: colors.primary, fontWeight: '900' },
  legend: { marginTop: space.lg, gap: space.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: space.sm },
  legendLabel: { color: colors.muted, fontSize: 12, flex: 1 },
  legendValue: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between' },
  settingLabel: { color: colors.muted, fontSize: 13 },
  settingValue: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: space.md },
  reset: { marginTop: space.xl },
  version: { color: colors.muted, textAlign: 'center', fontSize: 10, marginTop: space.lg },
});
