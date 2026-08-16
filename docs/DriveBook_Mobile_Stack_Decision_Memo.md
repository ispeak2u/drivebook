# DriveBook: Mobile Stack Decision Memo

**Native iOS + Native Android vs React Native + Expo**

---

**Prepared for:** Don (Paul Alfred) and Brother David
**Prompted by:** David's position that native opens up SDK utilization
**Document version:** 1.0
**Date:** August 2026
**Status:** DECIDED, August 2026. Don and David agreed to stay on React Native + Expo.

---

## Table of contents

1. The question on the table
2. Verdict
3. Testing the SDK argument
4. Where the SDK argument has real teeth
5. What DriveBook actually needs, SDK by SDK
6. The decisive factor is not technical
6a. "But we will have AI help"
7. What native costs you
8. The hedge, if you want native anyway
9. Recommendation and next actions
10. Open questions for David

---

## 1. The question on the table

The locked stack is React Native + Expo, with native iOS/Android rewrites explicitly listed as out of scope. David wants to reopen it. His argument, as relayed: **native for iOS and Android opens up SDK utilization.**

That argument deserves a real answer rather than a restatement of the original decision. It is also a reversal of a written decision, not a gap in one, so it needs a documented outcome either way.

---

## 2. Verdict

**Stay on React Native + Expo for the DriveBook MVP.**

The SDK premise is mostly outdated. It was true of Expo roughly five years ago and is no longer true of the toolchain you would actually use. Where the premise still holds, it holds for features DriveBook does not have in scope.

The reason to stay is not primarily technical. It is that **you and David are building this yourselves while learning mobile development**, and native means two codebases in two languages with two toolchains and two release pipelines. That is the whole argument. Everything below is supporting detail.

I want to be clear about the strength of this: if you told me you had a budget for an iOS specialist and an Android specialist, this memo would be much closer to a coin flip. It is the two-person, learning-as-you-go constraint that makes it lopsided.

---

## 3. Testing the SDK argument

### 3.1 Where the belief probably comes from

Expo used to have exactly one workflow, now called **Expo Go**. Expo Go is a pre-built container app you download from the store to preview your project. Because it is pre-built, it ships a fixed set of native code, and you could not add native SDKs of your own. If your library was not in Expo Go, you were stuck.

That constraint was real, it was widely written about, and it drove a lot of teams to reject Expo. It is also no longer how anyone ships an Expo app.

**Terms, since these are the crux of the whole disagreement:**

- **Native module** is a piece of Swift/Kotlin code that exposes a platform API to your JavaScript. It is the bridge between the two worlds.
- **Prebuild** (`npx expo prebuild`) generates the real `ios/` and `android/` project folders from your config. Also called Continuous Native Generation, or CNG. The native projects become a build artifact rather than something you hand-edit.
- **Config plugin** is a script that modifies those generated native files (`Info.plist`, `AndroidManifest.xml`, Gradle config) automatically during prebuild. It is how a library ships its own native setup instead of making you follow a fifteen-step README.
- **Development build** is your own custom version of the Expo Go container, built from your project, containing whatever native code you added. It replaces Expo Go the moment you need anything custom.

Put together: you write or install a native module, a config plugin wires it into the native projects, prebuild generates them, and a development build runs it on device. **There is no category of native SDK this excludes.** Expo's own documentation frames development builds as the answer for exactly this case, and points at libraries like the Sentry SDK as the worked example of binding to a native vendor SDK.

### 3.2 The Stripe case settles it

DriveBook's most SDK-heavy dependency is Stripe Connect. Stripe's own documentation for `@stripe/stripe-react-native` states that the React Native SDK **internally uses the native iOS and Android SDKs**.

That is the general shape of the thing. A React Native SDK is usually not a reimplementation competing with the native SDK. It is a wrapper around the native SDK. Choosing native does not "unlock" the Stripe iOS SDK, because you are already using the Stripe iOS SDK. You are just calling it from JavaScript.

Stripe also ships a `ConnectAccountOnboarding` component for React Native that handles business types, company representatives, document uploads, and identity verification. That is a large chunk of your Phase 5 instructor onboarding, already built, on the framework David wants to leave.

### 3.3 Scorecard on the premise

| Claim | Verdict |
|---|---|
| Expo blocks native SDKs | **Outdated.** True of Expo Go, false of development builds + config plugins |
| Native gives access to SDKs RN cannot reach | **Mostly false.** Most vendor RN SDKs wrap the native SDKs |
| Native gives better control over native code | **True, and it costs you two codebases to have it** |
| RN adds a dependency layer that can rot | **True. This is the strongest version of David's argument.** See section 4 |

---

## 4. Where the SDK argument has real teeth

I am not going to pretend this is one-sided. Four things David is right to worry about.

**Mapbox React Native is community-maintained.** Mapbox transferred oversight of the React Native Maps SDK to the open-source community. It is maintained by volunteers at `rnmapbox/maps`, and Mapbox states it is unable to provide formal support for it. The native iOS and Android Mapbox SDKs are first-party and supported. Maps are core to DriveBook (pickup pins, instructor search by area), so this is a genuine, named, non-hypothetical risk, not a generic "third-party libraries can break" hand-wave.

**iOS background location dies when the app is terminated.** `expo-location` does not deliver updates or execute code on iOS after the app is killed. Android continues to work after termination. If DriveBook ever wants live lesson tracking, or "your instructor is 5 minutes away" after the student swipes the app closed, this asymmetry will bite. It is not currently in any build phase, but it is the sort of feature a marketplace adds in year two.

**Day-one OS API access.** When Apple ships a new iOS capability in September, native gets it immediately. React Native gets it when someone wraps it. For a booking marketplace this rarely matters. Worth knowing anyway.

**Library rot is a real maintenance tax.** When an RN library goes unmaintained or breaks on a new OS version, you either find an alternative or write the native module yourself. On native you own that code from the start.

None of these four change the recommendation, because none of them are in DriveBook's MVP scope and the last three are manageable. But they should be written down so the decision is made with eyes open, and so nobody is surprised in eighteen months.

---

## 5. What DriveBook actually needs, SDK by SDK

Taken from the build phases in `Drivebook-via-Claude.md`.

| Need | Phase | RN + Expo status | Native advantage? |
|---|---|---|---|
| Auth (Supabase) | 4 | JS client, no native SDK needed | None |
| Payments, Stripe Connect Express, escrow, payouts | 7 | Official SDK wrapping the native SDKs, plus a Connect onboarding component | None |
| Push notifications | 8 | Expo Push over APNs/FCM | Marginal |
| Maps, pickup pin, area search | 6 | `rnmapbox/maps`, community-maintained | **Yes, support model is weaker** |
| Document upload, MTO certificates | 5 | `expo-image-picker`, `expo-document-picker` | None |
| Instructor availability calendar | 5 | Standard UI work | None |
| Ratings, disputes, admin flows | 8 | Standard UI work | None |
| Email and SMS (Resend, Twilio) | 8 | Server-side, client-agnostic | None |

**One row out of eight favours native, and it favours native on support model rather than capability.** That is the honest tally.

---

## 6. The decisive factor is not technical

You answered that you and David are building this yourselves, learning as you go. That answer, more than anything about SDKs, decides this.

Native means:

- **Two languages.** Swift with SwiftUI, and Kotlin with Jetpack Compose. Different idioms, different state models, different navigation patterns, different lifecycle rules.
- **Two toolchains.** Xcode and Android Studio, each with their own build systems, signing, provisioning, and failure modes.
- **Two codebases in lockstep.** Every screen, every validation rule, every error state, every edge case in your cancellation policy gets implemented twice. When the policy changes, it changes twice.
- **Two chances to be wrong.** Your cancellation and confirmation policy has strike logic, penalty flows, refund tiers, and a 1-hour confirmation SLA. Implementing that twice, correctly, in parallel, by people learning the platform, is where bugs live.
- **A Mac requirement that is permanent, not incidental.** You cannot build or ship iOS without one. This is true for RN too, though EAS Build gives you a hosted way around it.

React Native gives you one codebase, in TypeScript, which is the language your backend is already written in and the language you and David are already reading. Whatever else is true, that is a smaller surface to learn while also learning mobile development as a discipline.

---

## 6a. "But we will have AI help"

This is the strongest counter to section 6, and it deserves answering directly because it is the one that sounds most convincing.

**Where it holds.** Writing the same screen twice, once in Swift and once in Kotlin, is mechanical translation. That is precisely the kind of work an AI coding assistant does well. The learning curve on two unfamiliar languages drops substantially. If code *production* were the bottleneck, native would look far more reasonable than section 6 suggests.

**Where it fails.** The bottleneck is not production, it is **review**. This project already has a written principle for exactly this situation, established for the Hermes agent: *run `git diff` before accepting anything the agent writes, because an agent's self-report is not verification.*

Apply that principle honestly and the argument inverts. An AI assistant can produce Swift and Kotlin considerably faster than two people learning Swift and Kotlin can meaningfully review it. Choosing native means **twice the diff, in two languages neither reviewer is fluent in, on an application that moves real money through Stripe Connect and enforces a penalty policy with genuine financial consequences.**

The gap between what can be generated and what can be verified is the actual risk. Native widens that gap. It does not narrow it.

**Three things AI assistance does not remove:**

- **Two toolchains.** Xcode signing, provisioning profiles, Gradle builds, two independent sets of failure modes. An assistant can explain them. Someone still has to operate them.
- **Silent divergence.** Two codebases drift. A fix lands in the Kotlin and not the Swift. Detecting that is a review problem, which is the constrained resource.
- **Two test suites.** Phase 9 currently specifies Detox for end-to-end testing. Native means XCUITest plus Espresso, written and maintained separately.

**The argument that settles it:** AI assistance accelerates *both* options. It does not preferentially favour native. Compressing the React Native estimate from 16 to 18 weeks down to perhaps 11 to 13, and native from 28 to 36 down to perhaps 22 to 28, leaves the ratio essentially unchanged. Both timelines shift left. Native remains roughly double.

So the conclusion is unchanged, for a slightly different reason. It is not that two native codebases cannot be produced with AI help. It is that doing so generates more code than two non-specialists can meaningfully review, on a payments application, to gain one row out of eight on the SDK table in section 5.

---

## 7. What native costs you

The existing plan estimates **16 to 18 weeks** for the React Native build across phases 1 to 10.

Native does not double this, because design, backend, service contracts, QA planning, and store submission prep are shared. It roughly doubles the client implementation portion, which is the bulk of phases 4 through 8.

**Estimate: 28 to 36 weeks**, and I would treat the top of that range as more likely than the bottom given neither of you has shipped a native app before. Call it **an extra 3 to 4 months before you have anything in a store**.

Treat that as a planning estimate, not a measurement. The point is the order of magnitude, not the precision.

The ongoing cost matters more than the build cost. Every feature after launch carries the same doubling. A two-person team maintaining two native codebases spends most of its time keeping them in sync rather than shipping new things.

---

## 8. The hedge, if you want native anyway

If David feels strongly and you want to preserve the option, there is a middle path that costs you nothing now.

**Build on React Native + Expo with prebuild (CNG), not Expo Go.** Because prebuild generates real `ios/` and `android/` projects, you are never locked out of native code. You can drop into Swift or Kotlin for any specific feature that needs it, ship a native module, and keep everything else in TypeScript. If maps become a problem, you write a native module for maps, not a new app.

This is the "configuration is a preference, enforcement is code" principle applied to architecture. Rather than arguing about whether you might need native someday, you set up so that needing it later is a small change instead of a rewrite.

**Concrete guardrail:** decide now, in writing, what would trigger a native rewrite. For example, "if `rnmapbox/maps` goes unmaintained for two consecutive Mapbox major versions" or "if we commit to live lesson tracking with post-termination iOS background location." A named trigger is reviewable. "We might need native" is not.

---

## 9. Recommendation and next actions

**Recommendation: stay on React Native + Expo. Use prebuild and development builds from day one. Do not use Expo Go beyond initial spikes.**

Next actions:

1. **Send David sections 3 and 4 of this memo.** Section 3 is the rebuttal, section 4 is where he is right. Ask him specifically whether Expo Go is what he had in mind, and which SDK he has in mind that he believes React Native cannot reach. If he names one, that is a concrete thing to test rather than a general position.
2. **Prototype the map before committing.** The one genuine risk is `rnmapbox/maps`. Build the pickup-pin screen against it first, as a two-day spike, before phase 4 starts. If it is solid, the decision is settled. If it is painful, you have learned that cheaply.
3. **Record the decision.** Update `Drivebook-via-Claude.md` Appendix A to note that native was formally reconsidered in August 2026 and the outcome. A decision that gets reopened every few months is a decision that was never documented properly.
4. **Write the native trigger conditions** into `ARCHITECTURE.md` per section 8.

---

## 10. Open questions for David

Worth putting to him directly, since he may know something this memo does not:

1. Which specific SDK do you have in mind? Is there a named one?
2. Were you thinking of Expo Go, or of Expo with prebuild and development builds?
3. Is the concern capability, or is it control and long-term maintenance? Those have different answers, and if it is the second, section 4 is your argument, not the SDK one.
4. Do you see us adding live lesson tracking? That is the single feature that would most change this analysis.
5. Who writes the Swift and who writes the Kotlin, and what is your estimate of the calendar cost?

---

## Appendix: Sources

- Expo, "Add custom native code" and "Using Expo SDK, React Native, and third-party libraries"
- Expo, "Create and use config plugins"
- Expo, `expo-location` documentation and open issues on iOS background behaviour after termination
- Stripe, React Native SDK repository and Connect account onboarding documentation
- Mapbox, "Maps SDK for React Native" glossary entry on community maintenance
- `rnmapbox/maps` repository

---

*This memo supersedes nothing. It confirms the existing stack decision in `Drivebook-via-Claude.md` Appendix A, with added detail on why, and adds trigger conditions under which the decision should be revisited.*

---

## Decision log

| Date | Event |
|---|---|
| June 2026 | React Native + Expo selected. Recorded in `Drivebook-via-Claude.md` Appendix A. Native listed as out of scope. |
| August 2026 | Reopened by David on the grounds that native opens up SDK utilisation. |
| August 2026 | **Reconsidered and confirmed. React Native + Expo retained.** Prebuild and development builds to be used from the start, not Expo Go. |

**This decision should not be reopened again without one of the trigger conditions in section 8 being met, or new information not covered in sections 3 through 7.**

Outstanding actions carried forward from section 9:

- Two-day spike against `rnmapbox/maps` before Phase 4 begins. This is the one identified material risk in the decision.
- Write the native trigger conditions into `ARCHITECTURE.md`.
- Update `Drivebook-via-Claude.md` Appendix A to reference this memo.
