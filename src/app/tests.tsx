import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BottomNav } from '@/components/ui/bottom-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { part5QuestionCount, part5Tests } from '@/content/part5-catalog';
import { colors, radii, space } from '@/constants/theme';
import { canAccessPart5Test, FREE_PART5_TEST_COUNT, PART5_PRO_GATING_ENABLED } from '@/domain/part5';
import { uiCopy } from '@/i18n/copy';
import { useApp } from '@/state/app-provider';
import { usePurchases } from '@/state/purchase-provider';

export default function TestsScreen() {
  const router = useRouter();
  const { data, startPart5Test } = useApp();
  const { isPro } = usePurchases();
  const language = data.settings.uiLanguage;
  const copy = uiCopy[language].tests;
  const completed = Object.keys(data.part5Attempts).length;

  const openTest = (testId: string, testNumber: number) => {
    if (!canAccessPart5Test(testNumber, isPro)) {
      router.push('/pro');
      return;
    }
    startPart5Test(testId);
    router.push({ pathname: '/part5/[testId]', params: { testId } });
  };

  return (
    <Screen footer={<BottomNav />}>
      <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.subtitle}>{copy.subtitle}</Text>

      <Card style={styles.hero}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroCount}>{part5Tests.length}</Text>
            <Text style={styles.heroLabel}>{copy.catalog}</Text>
          </View>
          <View style={styles.completedBadge}>
            <Text style={styles.completedValue}>{completed}/{part5Tests.length}</Text>
            <Text style={styles.completedLabel}>{language === 'ja' ? '完了' : 'done'}</Text>
          </View>
        </View>
        <ProgressBar value={completed / part5Tests.length} color={colors.lime} />
        <Text style={styles.heroNote}>{PART5_PRO_GATING_ENABLED ? copy.freeNote : copy.testingNote}</Text>
      </Card>

      <View style={styles.list}>
        {part5Tests.map((test) => {
          const available = canAccessPart5Test(test.number, isPro);
          const premium = PART5_PRO_GATING_ENABLED && test.number > FREE_PART5_TEST_COUNT;
          const attempt = data.part5Attempts[test.id];
          const title = language === 'ja' ? test.titleJa : test.titleEn;
          return (
            <Card key={test.id} style={[styles.testCard, ...(!available ? [styles.lockedCard] : [])]}>
                <View style={styles.testTop}>
                  <View style={styles.numberBadge}>
                    <Text style={styles.number}>{String(test.number).padStart(2, '0')}</Text>
                  </View>
                  <View style={styles.testCopy}>
                    <Text style={styles.testTitle}>{title}</Text>
                    <Text style={styles.testMeta}>{copy.questions} · {copy.minutes}</Text>
                  </View>
                  <View style={[styles.accessBadge, premium ? styles.proBadge : styles.freeBadge]}>
                    <Text style={[styles.accessText, premium ? styles.proText : styles.freeText]}>
                      {premium ? copy.pro : copy.free}
                    </Text>
                  </View>
                </View>

                {attempt ? (
                  <View style={styles.attemptRow}>
                    <Text style={styles.best}>{copy.best} {attempt.bestScore}/40</Text>
                    <Text style={styles.attempts}>{copy.attempts} {attempt.attempts}</Text>
                  </View>
                ) : null}

                <Button
                  label={!available ? copy.unlock : attempt ? copy.retry : copy.start}
                  onPress={() => openTest(test.id, test.number)}
                  variant={available ? 'secondary' : 'primary'}
                  style={styles.testButton}
                />
            </Card>
          );
        })}
      </View>

      <Text style={styles.source}>{copy.sourceNote} · {part5QuestionCount} questions</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, marginTop: space.sm },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900', letterSpacing: -1, marginTop: space.xs },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: space.sm },
  hero: { backgroundColor: colors.primary, borderColor: colors.primary, marginTop: space.xl, padding: space.lg },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg },
  heroCount: { color: colors.white, fontSize: 35, fontWeight: '900', letterSpacing: -1 },
  heroLabel: { color: '#C9E4DD', fontSize: 11, fontWeight: '700', marginTop: 2 },
  completedBadge: { minWidth: 70, borderRadius: radii.md, backgroundColor: '#176F60', padding: space.sm, alignItems: 'center' },
  completedValue: { color: colors.lime, fontSize: 17, fontWeight: '900' },
  completedLabel: { color: '#C9E4DD', fontSize: 9, fontWeight: '700', marginTop: 2 },
  heroNote: { color: '#DCEDE8', fontSize: 11, lineHeight: 17, marginTop: space.md },
  list: { gap: space.md, marginTop: space.xl },
  testCard: { padding: space.md },
  lockedCard: { backgroundColor: '#FAFBF9' },
  testTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  numberBadge: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  number: { color: colors.primaryDark, fontSize: 17, fontWeight: '900' },
  testCopy: { flex: 1 },
  testTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  testMeta: { color: colors.muted, fontSize: 10, fontWeight: '600', marginTop: 4 },
  accessBadge: { borderRadius: radii.pill, paddingHorizontal: space.sm, paddingVertical: space.xs },
  freeBadge: { backgroundColor: colors.primarySoft },
  proBadge: { backgroundColor: colors.ink },
  accessText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  freeText: { color: colors.primaryDark },
  proText: { color: colors.lime },
  attemptRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.md, paddingTop: space.md, borderTopWidth: 1, borderTopColor: colors.line },
  best: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  attempts: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  testButton: { minHeight: 44, marginTop: space.md },
  source: { color: colors.muted, fontSize: 9, lineHeight: 15, textAlign: 'center', marginTop: space.xl },
});
