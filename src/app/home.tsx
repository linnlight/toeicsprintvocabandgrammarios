import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { vocabulary } from '@/content/catalog';
import { BottomNav } from '@/components/ui/bottom-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { colors, radii, space } from '@/constants/theme';
import { dueCount, masteryLevel } from '@/domain/scheduler';
import { currentDailyCount } from '@/domain/stats';
import { uiCopy } from '@/i18n/copy';
import { useApp } from '@/state/app-provider';

function greeting(copy: typeof uiCopy.ja.home | typeof uiCopy.en.home) {
  const hour = new Date().getHours();
  if (hour < 11) return copy.morning;
  if (hour < 18) return copy.afternoon;
  return copy.evening;
}

export default function HomeScreen() {
  const router = useRouter();
  const { data, startSprint, setLanguage } = useApp();
  const language = data.settings.uiLanguage;
  const copy = uiCopy[language].home;
  const today = currentDailyCount(data.stats);
  const goalProgress = today / data.settings.dailyGoal;
  const learned = Object.keys(data.reviews).length;
  const mastered = Object.values(data.reviews).filter((review) => masteryLevel(review) === 3).length;
  const due = dueCount(data.reviews);

  const begin = () => {
    const session = startSprint('daily');
    if (session.queue.length > 0) router.push('/sprint');
  };

  return (
    <Screen footer={<BottomNav />}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.greeting}>{greeting(copy)}</Text>
          <Text style={styles.logo}>Vocab Sprint</Text>
        </View>
        <View style={styles.topActions}>
          <Pressable accessibilityRole="button" accessibilityLabel={language === 'ja' ? 'Switch UI to English' : 'UIを日本語に変更'} onPress={() => setLanguage(language === 'ja' ? 'en' : 'ja')} style={({ pressed }) => [styles.languageButton, pressed && styles.languagePressed]}>
            <Text style={styles.languageText}>{language === 'ja' ? 'En' : 'Jp'}</Text>
          </Pressable>
          <View style={styles.streak}><Text style={styles.streakIcon}>♨</Text><Text style={styles.streakNumber}>{data.stats.streak}</Text><Text style={styles.streakLabel}>{copy.day}</Text></View>
        </View>
      </View>

      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.kicker}>{copy.todaySprint}</Text>
            <Text style={styles.heroTitle}>{language === 'ja' ? `${copy.todayWords}${data.settings.dailyGoal}${copy.words}` : `${copy.todayWords} ${data.settings.dailyGoal} ${copy.words}`}</Text>
            <Text style={styles.heroMeta}>{copy.approximate} {Math.max(3, Math.round(data.settings.dailyGoal * 0.45))} {copy.minutes} · {due > 0 ? `${copy.review} ${due} ${copy.words} — ${copy.reviewPriority}` : copy.newWords}</Text>
          </View>
          <View style={styles.targetBadge}><Text style={styles.targetSmall}>{copy.target}</Text><Text style={styles.targetScore}>{data.settings.targetScore}</Text></View>
        </View>
        <Button label={today >= data.settings.dailyGoal ? copy.anotherSprint : copy.startSprint} onPress={begin} style={styles.startButton} />
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{copy.todayProgress}</Text>
        <Text style={styles.progressCount}>{Math.min(today, data.settings.dailyGoal)} / {data.settings.dailyGoal} {copy.words}</Text>
      </View>
      <Card>
        <ProgressBar value={goalProgress} color={colors.primary} />
        <View style={styles.progressLabels}>
          <Text style={styles.progressHint}>{today >= data.settings.dailyGoal ? copy.goalComplete : `${copy.remaining} ${Math.max(0, data.settings.dailyGoal - today)} ${copy.words}`}</Text>
          <Text style={styles.progressPercent}>{Math.min(100, Math.round(goalProgress * 100))}%</Text>
        </View>
      </Card>

      <View style={styles.statGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statIcon}>◫</Text>
          <Text style={styles.statNumber}>{learned}</Text>
          <Text style={styles.statLabel}>{copy.learned}</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statIcon}>◆</Text>
          <Text style={styles.statNumber}>{mastered}</Text>
          <Text style={styles.statLabel}>{copy.mastered}</Text>
        </Card>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{copy.quickReview}</Text>
      </View>
      <Card style={styles.reviewCard}>
        <View style={styles.reviewIcon}><Text style={styles.reviewIconText}>↻</Text></View>
        <View style={styles.reviewCopy}>
          <Text style={styles.reviewTitle}>{learned === 0 ? copy.learnFirst : `${due || learned} ${copy.canReview}`}</Text>
          <Text style={styles.reviewMeta}>{learned === 0 ? copy.afterSprint : copy.fadingFirst}</Text>
        </View>
        <Button label={copy.view} variant="secondary" disabled={learned === 0} onPress={() => router.push('/review')} style={styles.smallButton} />
      </Card>

      <Text style={styles.catalogMeta}>{copy.catalog} {vocabulary.length} {copy.words} · {copy.local}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xl },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  languageButton: { minWidth: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  languagePressed: { opacity: 0.65 },
  languageText: { color: colors.primaryDark, fontSize: 13, fontWeight: '900' },
  greeting: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  logo: { color: colors.ink, fontSize: 24, fontWeight: '900', letterSpacing: -0.8, marginTop: 2 },
  streak: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: colors.amberSoft, paddingHorizontal: 13, paddingVertical: 9, borderRadius: radii.pill, gap: 3 },
  streakIcon: { color: colors.amber, fontSize: 18 },
  streakNumber: { color: colors.amber, fontSize: 18, fontWeight: '900' },
  streakLabel: { color: colors.amber, fontSize: 11, fontWeight: '700' },
  heroCard: { backgroundColor: colors.primary, borderColor: colors.primary, padding: space.lg },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  kicker: { color: colors.lime, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  heroTitle: { color: colors.white, fontSize: 29, fontWeight: '900', letterSpacing: -1, marginTop: space.sm },
  heroMeta: { color: '#C9E4DD', fontSize: 13, fontWeight: '600', marginTop: space.xs },
  targetBadge: { width: 66, height: 66, borderRadius: 33, borderWidth: 1, borderColor: '#4D9D8D', alignItems: 'center', justifyContent: 'center' },
  targetSmall: { color: '#C9E4DD', fontSize: 10 },
  targetScore: { color: colors.white, fontSize: 18, fontWeight: '900' },
  startButton: { marginTop: space.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: space.xl, marginBottom: space.sm },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  progressCount: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm },
  progressHint: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  progressPercent: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  statGrid: { flexDirection: 'row', gap: space.md, marginTop: space.md },
  statCard: { flex: 1, padding: space.md },
  statIcon: { color: colors.primary, fontSize: 18 },
  statNumber: { color: colors.ink, fontSize: 26, fontWeight: '900', marginTop: space.sm },
  statLabel: { color: colors.muted, fontSize: 11, fontWeight: '600', marginTop: 2 },
  reviewCard: { flexDirection: 'row', alignItems: 'center', padding: space.md, gap: space.md },
  reviewIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  reviewIconText: { color: colors.primary, fontSize: 24, fontWeight: '800' },
  reviewCopy: { flex: 1 },
  reviewTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  reviewMeta: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  smallButton: { minHeight: 42, paddingHorizontal: space.md },
  catalogMeta: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: space.xl },
});
