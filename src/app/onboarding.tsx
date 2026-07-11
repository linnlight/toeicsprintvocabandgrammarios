import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ChoiceChip } from '@/components/ui/choice-chip';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { APP_DISPLAY_NAME } from '@/constants/app';
import { colors, radii, space } from '@/constants/theme';
import { useApp } from '@/state/app-provider';

const currentScores = [300, 450, 600, 730];
const targetScores = [600, 730, 860, 990];
const goals = [10, 20, 30, 50];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [currentScore, setCurrentScore] = useState(450);
  const [targetScore, setTargetScore] = useState(730);
  const [dailyGoal, setDailyGoal] = useState(20);

  const finish = () => {
    completeOnboarding({ currentScore, targetScore, dailyGoal });
    router.replace('/home');
  };

  return (
    <Screen
      scroll={false}
      contentStyle={styles.content}
      footer={(
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + space.sm, space.lg) }]}>
          <Button label={step === 2 ? '学習をはじめる' : '次へ'} onPress={() => step === 2 ? finish() : setStep(step + 1)} disabled={step === 1 && targetScore <= currentScore} />
          {step > 0 ? <Button label="戻る" variant="ghost" onPress={() => setStep(step - 1)} /> : null}
        </View>
      )}
    >
      <View style={styles.brandRow}>
        <View style={styles.mark}><Text style={styles.markText}>V</Text></View>
        <Text style={styles.brand}>{APP_DISPLAY_NAME}</Text>
      </View>
      <ProgressBar value={(step + 1) / 3} />

      {step === 0 ? (
        <View style={styles.hero}>
          <View style={styles.heroArt}>
            <Text style={styles.heroWord}>SPRINT</Text>
            <View style={styles.miniCard}><Text style={styles.miniEn}>achieve</Text><Text style={styles.miniJa}>達成する</Text></View>
          </View>
          <Text style={styles.title}>1日数分で、{`\n`}TOEIC語彙を習慣に。</Text>
          <Text style={styles.body}>短いクイズと最適な復習タイミングで、覚えるまで何度でも出会えます。</Text>
          <View style={styles.points}>
            <Text style={styles.point}>✓  アカウント登録なし</Text>
            <Text style={styles.point}>✓  学習データはこの端末に保存</Text>
          </View>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.section}>
          <Text style={styles.eyebrow}>STEP 2</Text>
          <Text style={styles.title}>目標スコアを設定</Text>
          <Text style={styles.body}>出題レベルの目安に使います。あとで変更できます。</Text>
          <Text style={styles.label}>現在のスコア</Text>
          <View style={styles.chips}>{currentScores.map((score) => <ChoiceChip key={score} label={`${score}`} selected={currentScore === score} onPress={() => setCurrentScore(score)} />)}</View>
          <Text style={styles.label}>目標スコア</Text>
          <View style={styles.chips}>{targetScores.map((score) => <ChoiceChip key={score} label={`${score}`} selected={targetScore === score} onPress={() => setTargetScore(score)} />)}</View>
          {targetScore <= currentScore ? <Text style={styles.error}>目標は現在のスコアより高く設定してください。</Text> : null}
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.section}>
          <Text style={styles.eyebrow}>STEP 3</Text>
          <Text style={styles.title}>1日の単語数は？</Text>
          <Text style={styles.body}>無理なく続けられる数がおすすめです。</Text>
          <View style={styles.goalList}>
            {goals.map((goal) => (
              <ChoiceChip key={goal} label={`${goal}語${goal === 20 ? '  おすすめ' : ''}`} selected={dailyGoal === goal} onPress={() => setDailyGoal(goal)} />
            ))}
          </View>
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>あなたのプラン</Text>
            <Text style={styles.summaryValue}>{currentScore} → {targetScore}点</Text>
            <Text style={styles.summaryMeta}>毎日 {dailyGoal}語・約{Math.max(3, Math.round(dailyGoal * 0.45))}分</Text>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.lg },
  mark: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-5deg' }] },
  markText: { color: colors.lime, fontSize: 19, fontWeight: '900' },
  brand: { color: colors.ink, fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  hero: { flex: 1, justifyContent: 'center', paddingBottom: space.md },
  heroArt: { height: 180, backgroundColor: colors.primary, borderRadius: radii.lg, marginBottom: space.xl, overflow: 'hidden', justifyContent: 'center', padding: space.lg },
  heroWord: { color: 'rgba(255,255,255,0.13)', fontSize: 62, fontWeight: '900', position: 'absolute', left: -8, bottom: -8, letterSpacing: -4 },
  miniCard: { alignSelf: 'flex-end', backgroundColor: colors.surface, paddingVertical: space.md, paddingHorizontal: space.lg, borderRadius: radii.md, transform: [{ rotate: '4deg' }] },
  miniEn: { fontSize: 26, color: colors.ink, fontWeight: '900' },
  miniJa: { color: colors.primary, fontWeight: '700', marginTop: 3 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1.3, marginBottom: space.sm },
  title: { color: colors.ink, fontSize: 30, lineHeight: 39, fontWeight: '900', letterSpacing: -1.1 },
  body: { color: colors.muted, fontSize: 15, lineHeight: 24, marginTop: space.md },
  points: { gap: space.sm, marginTop: space.lg },
  point: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
  section: { flex: 1, paddingTop: space.xxl },
  label: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: space.xl, marginBottom: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  goalList: { gap: space.md, marginTop: space.xl, alignItems: 'stretch' },
  summary: { backgroundColor: colors.primarySoft, borderRadius: radii.lg, padding: space.lg, marginTop: space.xl },
  summaryLabel: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  summaryValue: { color: colors.ink, fontSize: 25, fontWeight: '900', marginTop: space.sm },
  summaryMeta: { color: colors.primaryDark, marginTop: space.xs, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 13, fontWeight: '600', marginTop: space.md },
  footer: { width: '100%', maxWidth: 560, paddingHorizontal: space.lg, paddingTop: space.md },
});
