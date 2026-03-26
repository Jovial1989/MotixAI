import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_bg.dart';
import 'app_localizations_en.dart';
import 'app_localizations_uk.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of S
/// returned by `S.of(context)`.
///
/// Applications need to include `S.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'generated/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: S.localizationsDelegates,
///   supportedLocales: S.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the S.supportedLocales
/// property.
abstract class S {
  S(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static S? of(BuildContext context) {
    return Localizations.of<S>(context, S);
  }

  static const LocalizationsDelegate<S> delegate = _SDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('bg'),
    Locale('en'),
    Locale('uk')
  ];

  /// No description provided for @appName.
  ///
  /// In en, this message translates to:
  /// **'Motixi'**
  String get appName;

  /// No description provided for @aiPoweredRepairGuides.
  ///
  /// In en, this message translates to:
  /// **'AI-Powered Repair Guides'**
  String get aiPoweredRepairGuides;

  /// No description provided for @welcomeBack.
  ///
  /// In en, this message translates to:
  /// **'Welcome back'**
  String get welcomeBack;

  /// No description provided for @signInToAccount.
  ///
  /// In en, this message translates to:
  /// **'Sign in to your account'**
  String get signInToAccount;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @emailPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'you@example.com'**
  String get emailPlaceholder;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @passwordPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'••••••••'**
  String get passwordPlaceholder;

  /// No description provided for @enterValidEmail.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid email'**
  String get enterValidEmail;

  /// No description provided for @minSixChars.
  ///
  /// In en, this message translates to:
  /// **'Min 6 characters'**
  String get minSixChars;

  /// No description provided for @signIn.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get signIn;

  /// No description provided for @noAccountSignUp.
  ///
  /// In en, this message translates to:
  /// **'Don\'t have an account? Sign up'**
  String get noAccountSignUp;

  /// No description provided for @continueAsGuest.
  ///
  /// In en, this message translates to:
  /// **'Start demo →'**
  String get continueAsGuest;

  /// No description provided for @createAccount.
  ///
  /// In en, this message translates to:
  /// **'Create account'**
  String get createAccount;

  /// No description provided for @getStarted.
  ///
  /// In en, this message translates to:
  /// **'Get started with Motixi'**
  String get getStarted;

  /// No description provided for @confirmPassword.
  ///
  /// In en, this message translates to:
  /// **'Confirm password'**
  String get confirmPassword;

  /// No description provided for @repeatPassword.
  ///
  /// In en, this message translates to:
  /// **'Repeat password'**
  String get repeatPassword;

  /// No description provided for @passwordsDoNotMatch.
  ///
  /// In en, this message translates to:
  /// **'Passwords do not match'**
  String get passwordsDoNotMatch;

  /// No description provided for @alreadyHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Already have an account? Sign in'**
  String get alreadyHaveAccount;

  /// No description provided for @back.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get back;

  /// No description provided for @onboardingWelcome.
  ///
  /// In en, this message translates to:
  /// **'Welcome to Motixi'**
  String get onboardingWelcome;

  /// No description provided for @onboardingWelcomeSub.
  ///
  /// In en, this message translates to:
  /// **'AI-powered repair guides that know your vehicle, your parts, and your job — all in one place.'**
  String get onboardingWelcomeSub;

  /// No description provided for @onboardingFeatures.
  ///
  /// In en, this message translates to:
  /// **'Everything you need to fix it right'**
  String get onboardingFeatures;

  /// No description provided for @onboardingFeaturesSub.
  ///
  /// In en, this message translates to:
  /// **'From oil changes to timing belts — precise, step-by-step guides with AI illustrations.'**
  String get onboardingFeaturesSub;

  /// No description provided for @featStepByStep.
  ///
  /// In en, this message translates to:
  /// **'Step-by-step guides'**
  String get featStepByStep;

  /// No description provided for @featStepByStepDesc.
  ///
  /// In en, this message translates to:
  /// **'Auto-generated from OEM data and trusted sources'**
  String get featStepByStepDesc;

  /// No description provided for @featAiIllustrations.
  ///
  /// In en, this message translates to:
  /// **'AI illustrations'**
  String get featAiIllustrations;

  /// No description provided for @featAiIllustrationsDesc.
  ///
  /// In en, this message translates to:
  /// **'Visual reference for every repair step'**
  String get featAiIllustrationsDesc;

  /// No description provided for @featAskGuide.
  ///
  /// In en, this message translates to:
  /// **'Ask the guide'**
  String get featAskGuide;

  /// No description provided for @featAskGuideDesc.
  ///
  /// In en, this message translates to:
  /// **'Get instant answers to repair questions'**
  String get featAskGuideDesc;

  /// No description provided for @choosePlan.
  ///
  /// In en, this message translates to:
  /// **'Choose your plan'**
  String get choosePlan;

  /// No description provided for @choosePlanSub.
  ///
  /// In en, this message translates to:
  /// **'Start your paid trial or activate access with an approved promo code.'**
  String get choosePlanSub;

  /// No description provided for @planTrial.
  ///
  /// In en, this message translates to:
  /// **'7-day trial'**
  String get planTrial;

  /// No description provided for @planTrialDesc.
  ///
  /// In en, this message translates to:
  /// **'Full access for 7 days. Card required.'**
  String get planTrialDesc;

  /// No description provided for @planTrialBadge.
  ///
  /// In en, this message translates to:
  /// **'Recommended'**
  String get planTrialBadge;

  /// No description provided for @planFree.
  ///
  /// In en, this message translates to:
  /// **'Demo access'**
  String get planFree;

  /// No description provided for @planFreeDesc.
  ///
  /// In en, this message translates to:
  /// **'Read-only tour with 3 real demo guides.'**
  String get planFreeDesc;

  /// No description provided for @continueBtn.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continueBtn;

  /// No description provided for @skipToPlan.
  ///
  /// In en, this message translates to:
  /// **'Skip to plan selection'**
  String get skipToPlan;

  /// No description provided for @startFreeTrial.
  ///
  /// In en, this message translates to:
  /// **'Start 7-day trial'**
  String get startFreeTrial;

  /// No description provided for @upgradeToPro.
  ///
  /// In en, this message translates to:
  /// **'Upgrade to Pro'**
  String get upgradeToPro;

  /// No description provided for @trialBillingNote.
  ///
  /// In en, this message translates to:
  /// **'Card required. No charge today. Renews after 7 days unless canceled.'**
  String get trialBillingNote;

  /// No description provided for @billingStartFailed.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t start the secure checkout. Please try again.'**
  String get billingStartFailed;

  /// No description provided for @billingConnectionIssue.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t reach billing right now. Please check your connection and try again.'**
  String get billingConnectionIssue;

  /// No description provided for @billingCancelled.
  ///
  /// In en, this message translates to:
  /// **'Checkout canceled. Your signup is still pending.'**
  String get billingCancelled;

  /// No description provided for @billingTrialStarted.
  ///
  /// In en, this message translates to:
  /// **'Your Pro Trial is active.'**
  String get billingTrialStarted;

  /// No description provided for @billingUpgradeSucceeded.
  ///
  /// In en, this message translates to:
  /// **'Your Pro plan is active.'**
  String get billingUpgradeSucceeded;

  /// No description provided for @billingCheckoutTitle.
  ///
  /// In en, this message translates to:
  /// **'Billing'**
  String get billingCheckoutTitle;

  /// No description provided for @billingProfileUnavailable.
  ///
  /// In en, this message translates to:
  /// **'No billing profile is set up yet.'**
  String get billingProfileUnavailable;

  /// No description provided for @billingSupportUnavailable.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t open billing support right now.'**
  String get billingSupportUnavailable;

  /// No description provided for @continueFree.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continueFree;

  /// No description provided for @settingUp.
  ///
  /// In en, this message translates to:
  /// **'Setting up…'**
  String get settingUp;

  /// No description provided for @somethingWentWrong.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong'**
  String get somethingWentWrong;

  /// No description provided for @noGuidesYet.
  ///
  /// In en, this message translates to:
  /// **'No guides yet'**
  String get noGuidesYet;

  /// No description provided for @noGuidesDesc.
  ///
  /// In en, this message translates to:
  /// **'Type a repair query above to generate your first AI-powered guide.'**
  String get noGuidesDesc;

  /// No description provided for @sampleGuidesTitle.
  ///
  /// In en, this message translates to:
  /// **'Demo Guides'**
  String get sampleGuidesTitle;

  /// No description provided for @sampleGuidesSubtitle.
  ///
  /// In en, this message translates to:
  /// **'3 real demo guides generated by Motixi — Demo mode only'**
  String get sampleGuidesSubtitle;

  /// No description provided for @stepCountLabel.
  ///
  /// In en, this message translates to:
  /// **'{count} steps'**
  String stepCountLabel(int count);

  /// No description provided for @newGuide.
  ///
  /// In en, this message translates to:
  /// **'New guide'**
  String get newGuide;

  /// No description provided for @signUpToGenerate.
  ///
  /// In en, this message translates to:
  /// **'Sign up to generate'**
  String get signUpToGenerate;

  /// No description provided for @generating.
  ///
  /// In en, this message translates to:
  /// **'Generating…'**
  String get generating;

  /// No description provided for @guestBanner.
  ///
  /// In en, this message translates to:
  /// **'Demo mode — 3 real demo guides in read-only access.'**
  String get guestBanner;

  /// No description provided for @guestBannerSignUp.
  ///
  /// In en, this message translates to:
  /// **'Sign up'**
  String get guestBannerSignUp;

  /// No description provided for @guestUpgradeTitle.
  ///
  /// In en, this message translates to:
  /// **'Sign up to unlock more'**
  String get guestUpgradeTitle;

  /// No description provided for @guestUpgradeDesc.
  ///
  /// In en, this message translates to:
  /// **'Sign up to generate guides, save your progress, and ask AI about each step.'**
  String get guestUpgradeDesc;

  /// No description provided for @availableInPro.
  ///
  /// In en, this message translates to:
  /// **'Available in Pro'**
  String get availableInPro;

  /// No description provided for @deleteGuide.
  ///
  /// In en, this message translates to:
  /// **'Delete guide'**
  String get deleteGuide;

  /// No description provided for @deleteGuideConfirm.
  ///
  /// In en, this message translates to:
  /// **'Delete \"{title}\"?'**
  String deleteGuideConfirm(String title);

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @delete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// No description provided for @search.
  ///
  /// In en, this message translates to:
  /// **'Search…'**
  String get search;

  /// No description provided for @safetyNotes.
  ///
  /// In en, this message translates to:
  /// **'Safety notes'**
  String get safetyNotes;

  /// No description provided for @toolsRequired.
  ///
  /// In en, this message translates to:
  /// **'Tools required'**
  String get toolsRequired;

  /// No description provided for @procedureSteps.
  ///
  /// In en, this message translates to:
  /// **'PROCEDURE — {count} STEPS'**
  String procedureSteps(int count);

  /// No description provided for @details.
  ///
  /// In en, this message translates to:
  /// **'Details'**
  String get details;

  /// No description provided for @searchingRefs.
  ///
  /// In en, this message translates to:
  /// **'Searching references…'**
  String get searchingRefs;

  /// No description provided for @analyzingRefs.
  ///
  /// In en, this message translates to:
  /// **'Analysing diagram layout…'**
  String get analyzingRefs;

  /// No description provided for @generatingIllustration.
  ///
  /// In en, this message translates to:
  /// **'Generating illustration…'**
  String get generatingIllustration;

  /// No description provided for @queued.
  ///
  /// In en, this message translates to:
  /// **'Queued…'**
  String get queued;

  /// No description provided for @preparingIllustration.
  ///
  /// In en, this message translates to:
  /// **'Preparing illustration…'**
  String get preparingIllustration;

  /// No description provided for @tapToExpand.
  ///
  /// In en, this message translates to:
  /// **'⤢ Tap to expand'**
  String get tapToExpand;

  /// No description provided for @tapToRegenerate.
  ///
  /// In en, this message translates to:
  /// **'Tap to regenerate'**
  String get tapToRegenerate;

  /// No description provided for @sourceBacked.
  ///
  /// In en, this message translates to:
  /// **'📄 {provider}'**
  String sourceBacked(String provider);

  /// No description provided for @webSynthesis.
  ///
  /// In en, this message translates to:
  /// **'🌐 Web Synthesis'**
  String get webSynthesis;

  /// No description provided for @aiGenerated.
  ///
  /// In en, this message translates to:
  /// **'AI-powered professional repair guide'**
  String get aiGenerated;

  /// No description provided for @askAiAboutStep.
  ///
  /// In en, this message translates to:
  /// **'Ask AI about this step'**
  String get askAiAboutStep;

  /// No description provided for @askAiHint.
  ///
  /// In en, this message translates to:
  /// **'e.g. What torque for this bolt?'**
  String get askAiHint;

  /// No description provided for @prev.
  ///
  /// In en, this message translates to:
  /// **'Prev'**
  String get prev;

  /// No description provided for @next.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get next;

  /// No description provided for @stepOf.
  ///
  /// In en, this message translates to:
  /// **'{current} / {total}'**
  String stepOf(int current, int total);

  /// No description provided for @torque.
  ///
  /// In en, this message translates to:
  /// **'Torque'**
  String get torque;

  /// No description provided for @warning.
  ///
  /// In en, this message translates to:
  /// **'Warning'**
  String get warning;

  /// No description provided for @make.
  ///
  /// In en, this message translates to:
  /// **'Make'**
  String get make;

  /// No description provided for @model.
  ///
  /// In en, this message translates to:
  /// **'Model'**
  String get model;

  /// No description provided for @year.
  ///
  /// In en, this message translates to:
  /// **'Year'**
  String get year;

  /// No description provided for @selectMake.
  ///
  /// In en, this message translates to:
  /// **'Select make…'**
  String get selectMake;

  /// No description provided for @selectModel.
  ///
  /// In en, this message translates to:
  /// **'Select model…'**
  String get selectModel;

  /// No description provided for @anyYear.
  ///
  /// In en, this message translates to:
  /// **'Any year (optional)'**
  String get anyYear;

  /// No description provided for @selectMakeFirst.
  ///
  /// In en, this message translates to:
  /// **'Select make first'**
  String get selectMakeFirst;

  /// No description provided for @modelInputPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'e.g. Qashqai, F-150…'**
  String get modelInputPlaceholder;

  /// No description provided for @partRepairDesc.
  ///
  /// In en, this message translates to:
  /// **'Part / repair description'**
  String get partRepairDesc;

  /// No description provided for @partInputPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'e.g. Hydraulic pump, brakes, oil change…'**
  String get partInputPlaceholder;

  /// No description provided for @oemPartNumber.
  ///
  /// In en, this message translates to:
  /// **'OEM / part number'**
  String get oemPartNumber;

  /// No description provided for @oemInputPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'e.g. 4633891'**
  String get oemInputPlaceholder;

  /// No description provided for @didYouMean.
  ///
  /// In en, this message translates to:
  /// **'Did you mean:'**
  String get didYouMean;

  /// No description provided for @review.
  ///
  /// In en, this message translates to:
  /// **'Review'**
  String get review;

  /// No description provided for @generateGuide.
  ///
  /// In en, this message translates to:
  /// **'Generate Guide'**
  String get generateGuide;

  /// No description provided for @confirmGenDesc.
  ///
  /// In en, this message translates to:
  /// **'AI will generate a step-by-step repair guide with images for each step.'**
  String get confirmGenDesc;

  /// No description provided for @vehicle.
  ///
  /// In en, this message translates to:
  /// **'Vehicle'**
  String get vehicle;

  /// No description provided for @repair.
  ///
  /// In en, this message translates to:
  /// **'Repair'**
  String get repair;

  /// No description provided for @partNo.
  ///
  /// In en, this message translates to:
  /// **'Part No.'**
  String get partNo;

  /// No description provided for @required.
  ///
  /// In en, this message translates to:
  /// **'required'**
  String get required;

  /// No description provided for @optional.
  ///
  /// In en, this message translates to:
  /// **'optional'**
  String get optional;

  /// No description provided for @history.
  ///
  /// In en, this message translates to:
  /// **'History'**
  String get history;

  /// No description provided for @noHistoryYet.
  ///
  /// In en, this message translates to:
  /// **'No history yet'**
  String get noHistoryYet;

  /// No description provided for @noHistoryDesc.
  ///
  /// In en, this message translates to:
  /// **'Guides you generate will appear here.'**
  String get noHistoryDesc;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @accountSection.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get accountSection;

  /// No description provided for @emailLabel.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get emailLabel;

  /// No description provided for @roleLabel.
  ///
  /// In en, this message translates to:
  /// **'Role'**
  String get roleLabel;

  /// No description provided for @tenantLabel.
  ///
  /// In en, this message translates to:
  /// **'Tenant'**
  String get tenantLabel;

  /// No description provided for @planSection.
  ///
  /// In en, this message translates to:
  /// **'Plan'**
  String get planSection;

  /// No description provided for @proActive.
  ///
  /// In en, this message translates to:
  /// **'⚡ Pro plan active'**
  String get proActive;

  /// No description provided for @proActiveDesc.
  ///
  /// In en, this message translates to:
  /// **'Unlimited guides · Priority image generation · Full guide history'**
  String get proActiveDesc;

  /// No description provided for @trialActive.
  ///
  /// In en, this message translates to:
  /// **'Trial active'**
  String get trialActive;

  /// No description provided for @trialDaysRemaining.
  ///
  /// In en, this message translates to:
  /// **'{days} day(s) remaining'**
  String trialDaysRemaining(int days);

  /// No description provided for @trialRenewsAfter.
  ///
  /// In en, this message translates to:
  /// **'Card on file. Renews as Pro after the 7-day trial unless canceled.'**
  String get trialRenewsAfter;

  /// No description provided for @freePlan.
  ///
  /// In en, this message translates to:
  /// **'Setup pending'**
  String get freePlan;

  /// No description provided for @freePlanDesc.
  ///
  /// In en, this message translates to:
  /// **'Complete billing or apply an approved promo code to activate full access.'**
  String get freePlanDesc;

  /// No description provided for @languageSection.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get languageSection;

  /// No description provided for @currentLanguageLabel.
  ///
  /// In en, this message translates to:
  /// **'Current language'**
  String get currentLanguageLabel;

  /// No description provided for @languageEnglish.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get languageEnglish;

  /// No description provided for @languageUkrainian.
  ///
  /// In en, this message translates to:
  /// **'Українська'**
  String get languageUkrainian;

  /// No description provided for @languageBulgarian.
  ///
  /// In en, this message translates to:
  /// **'Български'**
  String get languageBulgarian;

  /// No description provided for @planLabel.
  ///
  /// In en, this message translates to:
  /// **'Plan'**
  String get planLabel;

  /// No description provided for @priceLabel.
  ///
  /// In en, this message translates to:
  /// **'Price'**
  String get priceLabel;

  /// No description provided for @priceAfterTrialLabel.
  ///
  /// In en, this message translates to:
  /// **'Price after trial'**
  String get priceAfterTrialLabel;

  /// No description provided for @trialDaysLeftLabel.
  ///
  /// In en, this message translates to:
  /// **'Trial days left'**
  String get trialDaysLeftLabel;

  /// No description provided for @renewsOnLabel.
  ///
  /// In en, this message translates to:
  /// **'Renews on'**
  String get renewsOnLabel;

  /// No description provided for @nextBillingDateLabel.
  ///
  /// In en, this message translates to:
  /// **'Next billing date'**
  String get nextBillingDateLabel;

  /// No description provided for @paymentMethodLabel.
  ///
  /// In en, this message translates to:
  /// **'Payment method'**
  String get paymentMethodLabel;

  /// No description provided for @noPaymentMethodAdded.
  ///
  /// In en, this message translates to:
  /// **'No card on file yet'**
  String get noPaymentMethodAdded;

  /// No description provided for @cardLabel.
  ///
  /// In en, this message translates to:
  /// **'Card'**
  String get cardLabel;

  /// No description provided for @includesLabel.
  ///
  /// In en, this message translates to:
  /// **'Includes'**
  String get includesLabel;

  /// No description provided for @freePlanIncludes.
  ///
  /// In en, this message translates to:
  /// **'Billing or approved promo required'**
  String get freePlanIncludes;

  /// No description provided for @proTrialPlan.
  ///
  /// In en, this message translates to:
  /// **'Pro Trial'**
  String get proTrialPlan;

  /// No description provided for @proPlanTitle.
  ///
  /// In en, this message translates to:
  /// **'Pro'**
  String get proPlanTitle;

  /// No description provided for @contactBillingSupport.
  ///
  /// In en, this message translates to:
  /// **'Contact billing support'**
  String get contactBillingSupport;

  /// No description provided for @manageSubscription.
  ///
  /// In en, this message translates to:
  /// **'Manage subscription'**
  String get manageSubscription;

  /// No description provided for @perMonthShort.
  ///
  /// In en, this message translates to:
  /// **'month'**
  String get perMonthShort;

  /// No description provided for @guideHistory.
  ///
  /// In en, this message translates to:
  /// **'Guide History'**
  String get guideHistory;

  /// No description provided for @promoCode.
  ///
  /// In en, this message translates to:
  /// **'PROMO CODE'**
  String get promoCode;

  /// No description provided for @enterPromoCode.
  ///
  /// In en, this message translates to:
  /// **'Enter promo code…'**
  String get enterPromoCode;

  /// No description provided for @apply.
  ///
  /// In en, this message translates to:
  /// **'Apply'**
  String get apply;

  /// No description provided for @promoApplied.
  ///
  /// In en, this message translates to:
  /// **'Promo applied! You now have Pro access.'**
  String get promoApplied;

  /// No description provided for @signOut.
  ///
  /// In en, this message translates to:
  /// **'Sign out'**
  String get signOut;

  /// No description provided for @countrySelectTitle.
  ///
  /// In en, this message translates to:
  /// **'Choose your region'**
  String get countrySelectTitle;

  /// No description provided for @countrySelectSub.
  ///
  /// In en, this message translates to:
  /// **'This sets the language for the app. You can change it later in settings.'**
  String get countrySelectSub;

  /// No description provided for @countryGlobal.
  ///
  /// In en, this message translates to:
  /// **'🌐  Global (English)'**
  String get countryGlobal;

  /// No description provided for @countryUkraine.
  ///
  /// In en, this message translates to:
  /// **'🇺🇦  Ukraine'**
  String get countryUkraine;

  /// No description provided for @countryBulgaria.
  ///
  /// In en, this message translates to:
  /// **'🇧🇬  Bulgaria'**
  String get countryBulgaria;

  /// No description provided for @countryConfirm.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get countryConfirm;

  /// No description provided for @loading.
  ///
  /// In en, this message translates to:
  /// **'Loading…'**
  String get loading;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @error.
  ///
  /// In en, this message translates to:
  /// **'Error'**
  String get error;
}

class _SDelegate extends LocalizationsDelegate<S> {
  const _SDelegate();

  @override
  Future<S> load(Locale locale) {
    return SynchronousFuture<S>(lookupS(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['bg', 'en', 'uk'].contains(locale.languageCode);

  @override
  bool shouldReload(_SDelegate old) => false;
}

S lookupS(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'bg':
      return SBg();
    case 'en':
      return SEn();
    case 'uk':
      return SUk();
  }

  throw FlutterError(
      'S.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
