import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { colors, radii, space } from '@/constants/theme';
import { uiCopy } from '@/i18n/copy';
import { useApp } from '@/state/app-provider';
import { usePurchases } from '@/state/purchase-provider';

export default function ProScreen() {
  const router = useRouter();
  const { data } = useApp();
  const purchases = usePurchases();
  const copy = uiCopy[data.settings.uiLanguage].pro;

  const notify = (message: string) => {
    if (Platform.OS === 'web') globalThis.alert?.(message);
    else Alert.alert(copy.eyebrow, message);
  };

  const redeem = async () => {
    if (await purchases.redeemCode()) notify(copy.redeemed);
  };

  const restore = async () => {
    if (await purchases.restore()) notify(copy.restored);
  };

  const primaryAction = () => {
    void (purchases.isPro ? purchases.manage() : purchases.presentPaywall());
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={copy.back} onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
      </View>

      <Card style={[styles.hero, ...(purchases.isPro ? [styles.activeHero] : [])]}>
        <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
        <Text style={styles.title}>{purchases.isPro ? copy.activeTitle : copy.title}</Text>
        <Text style={styles.subtitle}>
          {purchases.isPro
            ? copy.activeSubscription
            : copy.subtitle}
        </Text>
        {!purchases.isPro ? <Text style={styles.currentPlan}>{copy.freeStatus}</Text> : null}
      </Card>

      <Text style={styles.sectionTitle}>{copy.benefitsTitle}</Text>
      <Card style={styles.benefits}>
        {[copy.benefitDaily, copy.benefitLibrary, copy.benefitFuture].map((benefit) => (
          <View key={benefit} style={styles.benefitRow}>
            <View style={styles.checkCircle}><Text style={styles.check}>✓</Text></View>
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </Card>

      {!purchases.isPro ? (
        <>
          <Text style={styles.sectionTitle}>{copy.plansTitle}</Text>
          <View style={styles.planGrid}>
            <Card style={styles.planCard}><Text style={styles.planName}>{copy.monthly}</Text><Text style={styles.storePrice}>App Store</Text></Card>
            <Card style={[styles.planCard, styles.yearlyCard]}>
              <Text style={styles.planName}>{copy.yearly}</Text>
              <Text style={styles.storePrice}>App Store</Text>
              <Text style={styles.yearlyHint}>{copy.yearlyHint}</Text>
            </Card>
          </View>
        </>
      ) : null}

      {!purchases.configured && purchases.ready ? <Text style={styles.unavailable}>{copy.unavailable}</Text> : null}
      {purchases.error ? <Text style={styles.error}>{copy.error}</Text> : null}
      <Button
        disabled={!purchases.ready || !purchases.configured}
        label={!purchases.ready ? copy.preparing : purchases.isPro ? copy.manage : copy.showPlans}
        loading={purchases.busy}
        onPress={primaryAction}
      />

      <Card style={styles.offerCard}>
        <View style={styles.gift}><Text style={styles.giftText}>%</Text></View>
        <View style={styles.offerCopy}>
          <Text style={styles.offerTitle}>{copy.offerTitle}</Text>
          <Text style={styles.offerBody}>{copy.offerBody}</Text>
        </View>
        <Button
          disabled={!purchases.ready || !purchases.configured}
          label={copy.redeem}
          onPress={() => void redeem()}
          variant="secondary"
          style={styles.offerButton}
        />
      </Card>

      <Button
        disabled={!purchases.ready || !purchases.configured}
        label={copy.restore}
        onPress={() => void restore()}
        variant="ghost"
      />
      <Text style={styles.legal}>{copy.legal}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.sm, marginBottom: space.lg },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.ink, fontSize: 30, lineHeight: 31, marginTop: -2 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 1.3 },
  hero: { backgroundColor: colors.ink, borderColor: colors.ink, padding: space.xl },
  activeHero: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  proBadge: { alignSelf: 'flex-start', backgroundColor: colors.lime, borderRadius: radii.pill, paddingHorizontal: space.md, paddingVertical: space.xs },
  proBadgeText: { color: colors.ink, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.white, fontSize: 29, lineHeight: 36, fontWeight: '900', letterSpacing: -1, marginTop: space.lg },
  subtitle: { color: '#C9D2D0', fontSize: 14, lineHeight: 22, marginTop: space.sm },
  currentPlan: { color: colors.lime, fontSize: 12, fontWeight: '800', marginTop: space.lg },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginTop: space.xl, marginBottom: space.sm },
  benefits: { gap: space.md },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  checkCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  check: { color: colors.primary, fontSize: 15, fontWeight: '900' },
  benefitText: { flex: 1, color: colors.ink, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg },
  planCard: { flexGrow: 1, flexBasis: 105, minHeight: 92, padding: space.md, justifyContent: 'space-between', boxShadow: 'none' },
  yearlyCard: { flexBasis: 160, backgroundColor: colors.amberSoft, borderColor: '#F1D3A4' },
  planName: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  storePrice: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  yearlyHint: { color: colors.amber, fontSize: 10, fontWeight: '800', marginTop: space.sm },
  unavailable: { color: colors.muted, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radii.sm, padding: space.md, fontSize: 12, lineHeight: 18, marginBottom: space.sm },
  error: { color: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: radii.sm, padding: space.md, fontSize: 12, lineHeight: 18, marginBottom: space.sm },
  offerCard: { marginTop: space.lg, padding: space.md, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.md },
  gift: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.amberSoft, alignItems: 'center', justifyContent: 'center' },
  giftText: { color: colors.amber, fontSize: 20, fontWeight: '900' },
  offerCopy: { flex: 1, minWidth: 210 },
  offerTitle: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  offerBody: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  offerButton: { width: '100%', minHeight: 46 },
  legal: { color: colors.muted, fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: space.sm, paddingHorizontal: space.md },
});
