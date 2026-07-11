# Payments and promotion codes

The app uses RevenueCat as the StoreKit integration layer. Users remain anonymous; RevenueCat creates and persists an anonymous app user identifier. Apple handles payment details, subscription billing, refunds, and offer-code redemption. The app only reads the verified `pro` entitlement.

## RevenueCat configuration

1. Create a RevenueCat project and add an App Store app with bundle ID `com.linnlight.vocabsprint`.
2. Connect App Store Connect to RevenueCat.
3. Create these products in App Store Connect and import them into RevenueCat:

   - `com.linnlight.vocabsprint.pro.monthly` — auto-renewable subscription
   - `com.linnlight.vocabsprint.pro.yearly` — auto-renewable subscription, yearly price

4. Create the RevenueCat entitlement `TOEIC Sprint Vocab & Grammar Pro` and attach both products.
5. Create the `default` offering with monthly and yearly packages.
6. Create and publish a RevenueCat Paywall for the `default` offering. Use RevenueCat dynamic package prices rather than hardcoded prices in the paywall.
7. Configure RevenueCat Customer Center so active users can manage purchases.
8. Copy `.env.example` to `.env` and add the RevenueCat **public iOS SDK key**:

   ```bash
   cp .env.example .env
   ```

   ```text
   EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_...
   ```

Never place a RevenueCat secret key or App Store Connect private key in the app.

## One-week and one-month promotion codes

Promotion codes are Apple subscription offer codes, not strings stored in the JavaScript bundle. This prevents users from extracting or repeatedly reusing a shared app-side code.

In App Store Connect:

1. Open the auto-renewable Pro subscription.
2. Create one offer-code offer with a free introductory period of **1 week**.
3. Create a second offer-code offer with a free introductory period of **1 month**.
4. Configure eligibility for new, existing, and expired subscribers as required.
5. Generate one-time codes or custom codes for each offer.

The app’s **コードを入力 / Enter code** button opens Apple’s native redemption sheet. Successful redemption activates the same RevenueCat `pro` entitlement. Offer codes apply to auto-renewable subscriptions.

## Testing

RevenueCat requires native code, so real purchases cannot be tested in the normal Expo Go runtime. After changing payment dependencies or keys:

```bash
npm run ios:prepare
npm run ios
```

Use an App Store sandbox tester or TestFlight for real transaction and offer-code testing. Before release, verify monthly purchase, yearly purchase, cancellation, expiration, restore, one-week code, and one-month code flows.
