import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Platform, StyleSheet, Switch, Text, View } from 'react-native';

import { vocabulary } from '@/content/catalog';
import { BottomNav } from '@/components/ui/bottom-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChoiceChip } from '@/components/ui/choice-chip';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { APP_DISPLAY_NAME, CONTENT_SCHEMA_VERSION } from '@/constants/app';
import { colors, space } from '@/constants/theme';
import { masteryLevel } from '@/domain/scheduler';
import { isCurrentMonthFreezeAvailable, rollingWeekSummary } from '@/domain/stats';
import { uiCopy } from '@/i18n/copy';
import { useApp } from '@/state/app-provider';
import { usePurchases } from '@/state/purchase-provider';

export default function ProgressScreen() {
  const router = useRouter();
  const { data, resetProgress, setRetentionSettings } = useApp();
  const { isPro } = usePurchases();
  const [updatingReminders, setUpdatingReminders] = useState(false);
  const copy = uiCopy[data.settings.uiLanguage].progress;
  const reviews = Object.values(data.reviews);
  const learned = reviews.length;
  const learning = reviews.filter((review) => masteryLevel(review) === 1).length;
  const familiar = reviews.filter((review) => masteryLevel(review) === 2).length;
  const mastered = reviews.filter((review) => masteryLevel(review) === 3).length;
  const accuracy = data.stats.totalAnswers === 0 ? 0 : Math.round((data.stats.correctAnswers / data.stats.totalAnswers) * 100);
  const weekly = rollingWeekSummary(data.stats);
  const freezeAvailable = isCurrentMonthFreezeAvailable(data.stats);

  const showReminderError = () => {
    const message = Platform.OS === 'web' ? copy.nativeOnly : copy.notificationsUnavailable;
    if (Platform.OS === 'web') globalThis.alert?.(message);
    else Alert.alert(copy.reminders, message);
  };
  const updateReminders = async (enabled: boolean, hour = data.settings.reminderHour) => {
    if (updatingReminders) return;
    setUpdatingReminders(true);
    const updated = await setRetentionSettings(enabled, hour);
    setUpdatingReminders(false);
    if (!updated) showReminderError();
  };

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

      <Text style={styles.sectionTitle}>{copy.weeklySummary}</Text>
      <Card style={styles.weeklyCard}>
        <View style={styles.weeklyStat}><Text style={styles.weeklyValue}>{weekly.studiedDays}<Text style={styles.weeklyUnit}> / 7</Text></Text><Text style={styles.weeklyLabel}>{copy.studiedDays}</Text></View>
        <View style={styles.weeklyStat}><Text style={styles.weeklyValue}>{weekly.words}</Text><Text style={styles.weeklyLabel}>{copy.weeklyWords}</Text></View>
        <View style={styles.weeklyStat}><Text style={styles.weeklyValue}>{weekly.sprints}</Text><Text style={styles.weeklyLabel}>{copy.weeklySprints}</Text></View>
        <View style={styles.weeklyStat}><Text style={styles.weeklyValue}>{weekly.accuracy}%</Text><Text style={styles.weeklyLabel}>{copy.weeklyAccuracy}</Text></View>
      </Card>

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
        <View style={styles.settingRow}><Text style={styles.settingLabel}>{copy.proPlan}</Text><Text style={[styles.settingValue, isPro && styles.proValue]}>{isPro ? copy.activePlan : copy.freePlan}</Text></View>
        <Button label={copy.managePlan} variant="secondary" onPress={() => router.push('/pro')} style={styles.planButton} />
        <View style={styles.divider} />
        <View style={styles.settingRow}><Text style={styles.settingLabel}>{copy.dailyGoal}</Text><Text style={styles.settingValue}>{data.settings.dailyGoal} {copy.words}</Text></View>
        <View style={styles.divider} />
        <View style={styles.settingRow}><Text style={styles.settingLabel}>{copy.longest}</Text><Text style={styles.settingValue}>{data.stats.longestStreak} {copy.day}</Text></View>
        <View style={styles.divider} />
        <View style={styles.settingRow}><Text style={styles.settingLabel}>{copy.storage}</Text><Text style={styles.settingValue}>{copy.thisDevice}</Text></View>
      </Card>

      <Text style={styles.sectionTitle}>{copy.retention}</Text>
      <Card>
        <View style={styles.retentionRow}>
          <View style={styles.retentionCopy}>
            <Text style={styles.retentionTitle}>{copy.reminders}</Text>
            <Text style={styles.retentionHelp}>{copy.reminderHelp}</Text>
          </View>
          <Switch
            accessibilityLabel={copy.reminders}
            disabled={updatingReminders}
            onValueChange={(enabled) => void updateReminders(enabled)}
            trackColor={{ false: colors.line, true: colors.primarySoft }}
            thumbColor={data.settings.remindersEnabled ? colors.primary : colors.muted}
            value={data.settings.remindersEnabled}
          />
        </View>
        {data.settings.remindersEnabled ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.reminderTimeLabel}>{copy.reminderTime}</Text>
            <View style={styles.timeChoices}>
              {[8, 12, 20].map((hour) => (
                <ChoiceChip
                  key={hour}
                  label={`${String(hour).padStart(2, '0')}:00`}
                  onPress={() => void updateReminders(true, hour)}
                  selected={data.settings.reminderHour === hour}
                />
              ))}
            </View>
          </>
        ) : null}
        <View style={styles.divider} />
        <View style={styles.retentionRow}>
          <View style={styles.retentionCopy}>
            <Text style={styles.retentionTitle}>{copy.streakFreeze}</Text>
            <Text style={styles.retentionHelp}>{copy.freezeHelp}</Text>
          </View>
          <Text style={[styles.freezeStatus, !freezeAvailable && styles.freezeUsed]}>
            {freezeAvailable ? copy.freezeAvailable : copy.freezeUsed}
          </Text>
        </View>
      </Card>

      <Button label={copy.reset} variant="danger" onPress={confirmReset} style={styles.reset} />
      <Text style={styles.version}>{APP_DISPLAY_NAME} MVP · content schema v{CONTENT_SCHEMA_VERSION}</Text>
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
  weeklyCard: { flexDirection: 'row', paddingHorizontal: space.sm },
  weeklyStat: { flex: 1, alignItems: 'center', paddingVertical: space.xs },
  weeklyValue: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  weeklyUnit: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  weeklyLabel: { color: colors.muted, fontSize: 9, fontWeight: '700', textAlign: 'center', marginTop: 3 },
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
  proValue: { color: colors.primary },
  planButton: { minHeight: 42, marginTop: space.md },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: space.md },
  retentionRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  retentionCopy: { flex: 1 },
  retentionTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  retentionHelp: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  reminderTimeLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', marginBottom: space.sm },
  timeChoices: { flexDirection: 'row', gap: space.sm },
  freezeStatus: { color: colors.primaryDark, backgroundColor: colors.primarySoft, borderRadius: 999, overflow: 'hidden', paddingHorizontal: space.sm, paddingVertical: 5, fontSize: 9, fontWeight: '800', textAlign: 'center', maxWidth: 105 },
  freezeUsed: { color: colors.muted, backgroundColor: colors.canvas },
  reset: { marginTop: space.xl },
  version: { color: colors.muted, textAlign: 'center', fontSize: 10, marginTop: space.lg },
});
