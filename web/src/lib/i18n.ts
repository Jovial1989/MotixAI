'use client';

import { createContext, useContext } from 'react';

// ── Locale types ─────────────────────────────────────────────────────────────

export type Locale = 'en' | 'uk' | 'bg';

export const LOCALE_KEY = 'motix_locale';
export const COUNTRY_KEY = 'motix_country';

export type Country = 'global' | 'ukraine' | 'bulgaria';

export const COUNTRY_LOCALE_MAP: Record<Country, Locale> = {
  global: 'en',
  ukraine: 'uk',
  bulgaria: 'bg',
};

export const COUNTRIES: { id: Country; flag: string; label: string }[] = [
  { id: 'global', flag: '🌍', label: 'Global / English' },
  { id: 'ukraine', flag: '🇺🇦', label: 'Україна' },
  { id: 'bulgaria', flag: '🇧🇬', label: 'България' },
];

// ── Translation dictionary shape ─────────────────────────────────────────────

export interface Translations {
  // Common
  common: {
    appName: string;
    search: string;
    back: string;
    continue_: string;
    save: string;
    cancel: string;
    delete_: string;
    edit: string;
    retry: string;
    loading: string;
    or: string;
    all: string;
    optional: string;
    required: string;
    email: string;
    password: string;
    logOut: string;
    logIn: string;
    signIn: string;
    signUp: string;
    guides: string;
    steps: string;
    vehicle: string;
    vehicles: string;
    settings: string;
    profile: string;
    dashboard: string;
    copyrightNotice: string;
    product: string;
    about: string;
    contacts: string;
  };

  // Navigation
  nav: {
    howItWorks: string;
    features: string;
    pricing: string;
    startTrial: string;
    openNavigation: string;
    closeNavigation: string;
  };

  // Landing / Hero
  landing: {
    heroEyebrow: string;
    heroTitle: string;
    heroTitleGrad: string;
    heroSub: string;
    searchPlaceholder: string;
    tryLabel: string;
    recentLabel: string;
    popularRepairs: string;
    guidesCount: string;
    // Logos bar
    trustedBy: string;
    // How it works
    howEyebrow: string;
    howTitle: string;
    step01title: string;
    step01text: string;
    step02title: string;
    step02text: string;
    step03title: string;
    step03text: string;
    step04title: string;
    step04text: string;
    // Stats
    statGeneration: string;
    statSteps: string;
    statAiGenerated: string;
    statVehicleModels: string;
    // Features
    featuresEyebrow: string;
    featuresTitle: string;
    featuresSub: string;
    feat1title: string;
    feat1desc: string;
    feat2title: string;
    feat2desc: string;
    feat3title: string;
    feat3desc: string;
    feat4title: string;
    feat4desc: string;
    feat5title: string;
    feat5desc: string;
    feat6title: string;
    feat6desc: string;
    // Mobile section
    mobileEyebrow: string;
    mobileTitle: string;
    mobileSub: string;
    mobileBullet1: string;
    mobileBullet2: string;
    mobileBullet3: string;
    mobileEarlyAccess: string;
    mobileComingSoon: string;
    // Phone mockup
    phoneMyWorkspace: string;
    phoneGuides: string;
    phoneGuidesCount: string;
    phoneSearchGuides: string;
    phoneRecent: string;
    phoneGarage: string;
    phoneProfile: string;
    phoneBack: string;
    phoneToolsRequired: string;
    phoneSafetyNotes: string;
    phoneSafetyLine1: string;
    phoneSafetyLine2: string;
    phoneStepOf: string;
    phoneOfSteps: string;
    // Pricing
    pricingEyebrow: string;
    pricingTitle: string;
    pricingSub: string;
    planFreeName: string;
    planFreeDesc: string;
    planFreeItem1: string;
    planFreeItem2: string;
    planFreeItem3: string;
    planFreeItem4: string;
    planFreeGetStarted: string;
    planProName: string;
    planProDesc: string;
    planProItem1: string;
    planProItem2: string;
    planProItem3: string;
    planProItem4: string;
    planProItem5: string;
    planProStartTrial: string;
    planProMostPopular: string;
    planEntName: string;
    planEntDesc: string;
    planEntItem1: string;
    planEntItem2: string;
    planEntItem3: string;
    planEntItem4: string;
    planEntItem5: string;
    planEntContactUs: string;
    planPerMonth: string;
    planCustom: string;
    // CTA band
    ctaEyebrow: string;
    ctaTitle: string;
    ctaSub: string;
    ctaStartTrial: string;
    ctaAlreadyHaveAccount: string;
    // Demo mockup (search hero right side)
    demoSourceLabel: string;
    demoOemVerified: string;
    demoVehicle1: string;
    demoTitle1: string;
    demoViewBadge: string;
    demoTime1: string;
    demoTools1: string;
    demoSteps1: string;
    demoSafety1: string;
    demoProcTitle: string;
    demoProcStep: string;
    demoProcVehicle: string;
    demoStep1: string;
    demoStep2: string;
    demoStep3: string;
    demoStep4: string;
    demoStep5: string;
    demoAiOrganized: string;
    demoTime2: string;
    demoTorqueTag: string;
    demoVerifiedTag: string;
  };

  // Auth modal (search hero)
  authModal: {
    title: string;
    sub: string;
    createAccount: string;
    signIn: string;
    continueAsGuest: string;
    guestLoadingText: string;
    guestNote: string;
  };

  // Auth pages
  auth: {
    welcomeBack: string;
    noAccount: string;
    createOneFree: string;
    forgotPassword: string;
    signingIn: string;
    createAccount: string;
    alreadyHaveAccount: string;
    passwordMinLength: string;
    creatingAccount: string;
    continueAsGuest: string;
    loginFailed: string;
    signupFailed: string;
    guestFailed: string;
  };

  // Onboarding
  onboarding: {
    welcomeHeading: string;
    welcomeSub: string;
    featuresHeading: string;
    featuresSub: string;
    feat1title: string;
    feat1desc: string;
    feat2title: string;
    feat2desc: string;
    feat3title: string;
    feat3desc: string;
    choosePlanHeading: string;
    choosePlanSub: string;
    planTrialName: string;
    planTrialDesc: string;
    planTrialBadge: string;
    planTrialNote: string;
    planPremiumName: string;
    planPremiumDesc: string;
    planFreeName: string;
    planFreeDesc: string;
    startMyFreeTrial: string;
    getPremiumAccess: string;
    continueFree: string;
    settingUp: string;
    skipToPlanSelection: string;
    somethingWentWrong: string;
  };

  // Dashboard
  dash: {
    sampleGuides: string;
    guidesTitle: string;
    guidesSub: string;
    sampleGuidesSub: string;
    newGuide: string;
    // Guest banner
    guestBanner: string;
    guestBannerLink: string;
    guestBannerSuffix: string;
    // Analytics
    thisMonth: string;
    timeSaved: string;
    topRepair: string;
    // Search & filter
    searchGuides: string;
    filterSampleGuides: string;
    allDifficulties: string;
    beginner: string;
    intermediate: string;
    advanced: string;
    expert: string;
    mostRecent: string;
    aToZ: string;
    // Empty states
    loadingGuides: string;
    noSampleMatch: string;
    noSampleMatchSub: string;
    clearFilter: string;
    noResultsFor: string;
    noResultsSub: string;
    couldNotLoadGuides: string;
    noGuidesYet: string;
    noGuidesYetSub: string;
    // Guide card
    deleteGuide: string;
    imagesGenerating: string;
    imagesFailed: string;
    ready: string;
  };

  // Garage
  garage: {
    title: string;
    sub: string;
    noVehiclesYet: string;
    noVehiclesSub: string;
    guideCount: string;
    guidesCount: string;
  };

  // Jobs
  jobs: {
    title: string;
    sub: string;
    logRepairJob: string;
    problemDescription: string;
    notes: string;
    additionalContext: string;
    selectVehicle: string;
    createJob: string;
    creating: string;
    noJobsYet: string;
    noJobsSub: string;
    pending: string;
    inProgress: string;
    completed: string;
    start: string;
    complete: string;
    guideLabel: string;
  };

  // Requests
  requests: {
    title: string;
    sub: string;
    requestAGuide: string;
    vehicleModel: string;
    repairType: string;
    partNumber: string;
    notes: string;
    additionalContext: string;
    submitRequest: string;
    submitting: string;
    noRequestsYet: string;
    noRequestsSub: string;
    guideReady: string;
  };

  // Manuals (Enterprise)
  manuals: {
    title: string;
    sub: string;
    uploadManual: string;
    titleField: string;
    pdfUrl: string;
    vehicleModel: string;
    extractedText: string;
    saveManual: string;
    saving: string;
    generateFromManual: string;
    selectManual: string;
    partName: string;
    oemNumber: string;
    generateGuide: string;
    generating: string;
    guideReady: string;
    uploadedManuals: string;
    noManualsUploaded: string;
    noManualsSub: string;
    manual: string;
  };

  // Settings
  settingsView: {
    title: string;
    sub: string;
    account: string;
    emailLabel: string;
    planLabel: string;
    trialEndsIn: string;
    day: string;
    days: string;
    planAndUsage: string;
    planPro: string;
    proActive: string;
    proActiveDesc: string;
    trialActive: string;
    trialRenewsAs: string;
    manageSubscription: string;
    startTrialCta: string;
    guidesThisMonth: string;
    havePromoCode: string;
    enterCode: string;
    apply: string;
    promoApplied: string;
    invalidPromoCode: string;
  };

  // Sidebar
  sidebar: {
    sampleGuides: string;
    createFreeAccount: string;
    newGuide: string;
    workshop: string;
    jobs: string;
    requests: string;
    analytics: string;
    account: string;
    settings: string;
    exitDemo: string;
    logOut: string;
    enterprise: string;
    pro: string;
    trial: string;
    free: string;
    limitReached: string;
    upgrade: string;
  };

  // Guide form
  guideForm: {
    // Mode tabs
    aiGenerated: string;
    sourceBacked: string;
    // Step 1
    step1title: string;
    manualEntry: string;
    vinDecode: string;
    vinOptional: string;
    vinNumber: string;
    decode: string;
    vinError11: string;
    couldNotDecodeVin: string;
    networkError: string;
    // Step 2
    step2title: string;
    partRepairDesc: string;
    partPlaceholder: string;
    didYouMean: string;
    oemPartNumber: string;
    review: string;
    // Step 3
    step3title: string;
    vehicleLabel: string;
    vinLabel: string;
    repairLabel: string;
    partNoLabel: string;
    generateGuide: string;
    generatingGuide: string;
    // Source-backed form
    sourceTitle: string;
    sourceBadge: string;
    sourceDesc: string;
    make: string;
    model: string;
    year: string;
    task: string;
    selectModel: string;
    selectYear: string;
    selectTask: string;
    source: string;
    sourceNissan: string;
    sourceToyota: string;
    generateFromSource: string;
    synthesisingFromSource: string;
    // Source task labels
    taskOilChange: string;
    taskBrakePad: string;
    taskBrakeFluid: string;
    continue: string;
    back: string;
    edit: string;
  };

  // Guide detail
  guideDetail: {
    backToGuides: string;
    overview: string;
    difficulty: string;
    timeEstimate: string;
    stepsLabel: string;
    toolsRequired: string;
    safetyWarnings: string;
    step: string;
    stepOf: string;
    previous: string;
    next: string;
    done: string;
    preparingIllustration: string;
    generatingImage: string;
    imageReady: string;
    imageFailed: string;
    generateImage: string;
    noImageAvailable: string;
    procedure: string;
    moreTools: string;
    showLess: string;
    safetyNotes: string;
    nSafetyNotes: string;
    sourceReferences: string;
    prev: string;
    torque: string;
    confidence: string;
    expand: string;
    fallbackIllustration: string;
    regenerate: string;
    retryIllustration: string;
    queuedStatus: string;
    searchingRefs: string;
    analyzingRefs: string;
    generatingStatus: string;
    aiIllustration: string;
    availableForRegistered: string;
    createFreeAccount: string;
    createAccountToContinue: string;
    upgradeDesc: string;
    signIn: string;
    askAiAboutStep: string;
    askAi: string;
    askPlaceholder: string;
    ask: string;
    aiExplanationError: string;
    errorLoadMsg: string;
    sourceBackedLabel: string;
    webSynthesisLabel: string;
    aiGeneratedLabel: string;
  };

  // Profile
  profilePage: {
    title: string;
    sub: string;
    accountSection: string;
    firstName: string;
    lastName: string;
    emailLabel: string;
    primaryVehicle: string;
    yourPlan: string;
    freePlan: string;
    proPlan: string;
    enterprisePlan: string;
    guidesThisMonth: string;
    imageGeneration: string;
    upgradeToProPrice: string;
    unlimited: string;
    priorityImage: string;
    mobileEnabled: string;
    apiEnabled: string;
    nextBilling: string;
    manageSubscription: string;
    teamMembers: string;
    manualsUploaded: string;
    customSla: string;
    accountManager: string;
    contactSupport: string;
    preferences: string;
    country: string;
    preferredBrands: string;
    billingDetails: string;
    currentPlan: string;
    nextBillingDate: string;
    paymentMethod: string;
    cardEndingIn: string;
    noPaymentMethod: string;
    addPaymentMethod: string;
    companyName: string;
    billingEmail: string;
    vatTaxId: string;
    billingAddress: string;
    billingHistory: string;
    upgradeToPro: string;
    saved: string;
    saveProfile: string;
    perMonth: string;
    active: string;
    organization: string;
  };

  // Nav auth dropdown
  navAuth: {
    dashboard: string;
    profile: string;
    settings: string;
    logOut: string;
    logIn: string;
    startTrial: string;
  };

  // Dashboard notices
  dashboard: {
    trialStartedNotice: string;
    proActivatedNotice: string;
    billingCancelledNotice: string;
  };

  // Vehicle selector
  vehicleSelector: {
    brand: string;
    model: string;
    year: string;
    selectBrand: string;
    selectModel: string;
    selectYear: string;
    loading: string;
  };

  // Hero actions
  heroActions: {
    startForFree: string;
    viewDashboard: string;
  };

  // Forgot password
  forgotPassword: {
    title: string;
    sub: string;
    emailLabel: string;
    sendResetToken: string;
    sending: string;
    tokenReady: string;
    tokenReadySub: string;
    tokenNote: string;
    continueToReset: string;
    backToSignIn: string;
  };

  // Reset password
  resetPassword: {
    title: string;
    backToSignIn: string;
    resetTokenLabel: string;
    pasteToken: string;
    newPassword: string;
    confirmNewPassword: string;
    updatePassword: string;
    updating: string;
    passwordMinLength: string;
    passwordsMismatch: string;
    invalidToken: string;
  };

  // About page
  aboutPage: {
    // Hero
    heroEyebrow: string;
    heroTitle: string;
    heroSub: string;
    // Our Story
    storyEyebrow: string;
    storyTitle: string;
    storyP1: string;
    storyP2: string;
    // Leadership
    leadershipEyebrow: string;
    leadershipTitle: string;
    ceoName: string;
    ceoRole: string;
    ceoIntro: string;
    ceoBullets: string[];
    ctoName: string;
    ctoRole: string;
    ctoIntro: string;
    ctoBullets: string[];
    linkedinLabel: string;
    emailLabel: string;
    // Why We Build
    whyEyebrow: string;
    whyTitle: string;
    whyCards: { icon: string; title: string; desc: string }[];
    // Experience
    expEyebrow: string;
    expTitle: string;
    expBullets: { label: string; desc: string }[];
    // CTA
    ctaQuote: string;
    ctaQuoteAttr: string;
    ctaTrial: string;
    ctaContact: string;
  };

  // Product page
  productPage: {
    eyebrow: string;
    title: string;
    sub: string;
    startTrial: string;
    tryDemo: string;
    talkToFounder: string;
    guestAuthFailed: string;
    walkthroughEyebrow: string;
    walkthroughTitle: string;
    walkthroughSub: string;
    step01: string;
    step01title: string;
    step01desc: string;
    step02: string;
    step02title: string;
    step02desc: string;
    step03: string;
    step03title: string;
    step03desc: string;
    whoEyebrow: string;
    whoTitle: string;
    whoSub: string;
    forCards: { icon: string; label: string; desc: string }[];
    guideOutputEyebrow: string;
    guideOutputTitle: string;
    guideOutputSub: string;
    guideOutputs: string[];
    whyEyebrow: string;
    whyTitle: string;
    differentiators: { vs: string; title: string; desc: string }[];
    ctaEyebrow: string;
    ctaTitle: string;
    ctaSub: string;
    alreadyHaveAccount: string;
  };

  // Contact page
  contactPage: {
    eyebrow: string;
    title: string;
    sub: string;
    founderName: string;
    founderRole: string;
    email: string;
    linkedin: string;
    getInTouchTitle: string;
    getInTouchP1: string;
    getInTouchP2: string;
    responseNote: string;
  };

  // New guide view
  newGuide: {
    backToGuides: string;
  };

  // Country selector modal
  countrySelector: {
    title: string;
    sub: string;
    confirm: string;
  };

  // Footer
  footer: {
    product: string;
    about: string;
    contact: string;
    email: string;
  };

  // Relative time
  time: {
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    yesterday: string;
    daysAgo: string;
  };
}

// ── English ──────────────────────────────────────────────────────────────────

const en: Translations = {
  common: {
    appName: 'Motixi',
    search: 'Search',
    back: 'Back',
    continue_: 'Continue',
    save: 'Save',
    cancel: 'Cancel',
    delete_: 'Delete',
    edit: 'Edit',
    retry: 'Retry',
    loading: 'Loading…',
    or: 'or',
    all: 'All',
    optional: 'optional',
    required: '*',
    email: 'Email',
    password: 'Password',
    logOut: 'Log out',
    logIn: 'Log in',
    signIn: 'Sign in',
    signUp: 'Sign up',
    guides: 'Guides',
    steps: 'steps',
    vehicle: 'Vehicle',
    vehicles: 'Vehicles',
    settings: 'Settings',
    profile: 'Profile',
    dashboard: 'Dashboard',
    copyrightNotice: '© 2026 Motixi. All rights reserved.',
    product: 'Product',
    about: 'About',
    contacts: 'Contacts',
  },

  nav: {
    howItWorks: 'How it works',
    features: 'Features',
    pricing: 'Pricing',
    startTrial: 'Start trial',
    openNavigation: 'Open navigation',
    closeNavigation: 'Close navigation',
  },

  landing: {
    heroEyebrow: 'AI Repair Intelligence',
    heroTitle: 'The repair knowledge base',
    heroTitleGrad: 'for every vehicle.',
    heroSub: 'Ask any repair question. Motixi searches its knowledge base — if the guide exists, you get it instantly. If not, AI generates it and stores it for everyone.',
    searchPlaceholder: 'Search by vehicle, issue, or component…',
    tryLabel: 'Try:',
    recentLabel: 'Recent:',
    popularRepairs: 'Popular Repairs',
    guidesCount: 'guides',
    trustedBy: 'Trusted by teams at',
    howEyebrow: 'How it works',
    howTitle: 'From query to guide in four steps',
    step01title: 'Search or ask a question',
    step01text: 'Type a vehicle model and repair description — or ask naturally like "bmw e90 oil change".',
    step02title: 'AI searches knowledge base',
    step02text: 'Motixi checks thousands of stored guides before generating anything new.',
    step03title: 'Instant result or new guide',
    step03text: 'Get an existing guide in under a second, or AI generates a new one in under 3 seconds.',
    step04title: 'Follow step-by-step',
    step04text: 'Open the guide on web or mobile and follow inline with engineering diagrams.',
    statGeneration: 'Guide generation',
    statSteps: 'Steps per guide',
    statAiGenerated: 'AI-generated',
    statVehicleModels: 'Vehicle models',
    featuresEyebrow: 'Features',
    featuresTitle: 'Everything a technician needs',
    featuresSub: 'Built for speed, accuracy, and real-world workshop conditions.',
    feat1title: 'Instant guide generation',
    feat1desc: 'VIN or model + part number → full structured repair guide in under 3 seconds.',
    feat2title: 'Step-by-step precision',
    feat2desc: '8–15 ordered steps with torque specs, required tools, and safety warnings built in.',
    feat3title: 'Engineering diagrams',
    feat3desc: 'AI-generated technical diagrams rendered per step via background image jobs.',
    feat4title: 'Web & mobile',
    feat4desc: 'One unified backend powers both the Next.js dashboard and Flutter mobile app.',
    feat5title: 'Background job queue',
    feat5desc: 'Image generation runs asynchronously with real-time status polling on the client.',
    feat6title: 'Enterprise-ready',
    feat6desc: 'Tenant isolation, custom manual ingestion, role-based access, and admin controls.',
    mobileEyebrow: 'Mobile App',
    mobileTitle: 'Workshop guides\nin your pocket',
    mobileSub: 'The same AI-generated repair guides, optimized for mobile. Step through procedures at the bench, pinch-to-zoom diagrams, and track progress — all offline-capable.',
    mobileBullet1: 'Swipe through steps one-handed',
    mobileBullet2: 'Pinch-to-zoom on engineering diagrams',
    mobileBullet3: 'Offline mode for workshop use',
    mobileEarlyAccess: 'Request early access',
    mobileComingSoon: 'Coming soon to iOS and Android',
    phoneMyWorkspace: 'My Workspace',
    phoneGuides: 'Guides',
    phoneGuidesCount: '3 guides · this week',
    phoneSearchGuides: 'Search guides…',
    phoneRecent: 'Recent',
    phoneGarage: 'Garage',
    phoneProfile: 'Profile',
    phoneBack: 'Back',
    phoneToolsRequired: 'Tools required',
    phoneSafetyNotes: 'Safety notes',
    phoneSafetyLine1: 'Isolate battery and hydraulic pressure before disassembly.',
    phoneSafetyLine2: 'Use jack stands and wheel chocks on level ground.',
    phoneStepOf: 'STEP 1 OF 10',
    phoneOfSteps: 'of 10 steps',
    pricingEyebrow: 'Pricing',
    pricingTitle: 'Simple, transparent pricing',
    pricingSub: 'Start free. Upgrade when you need more.',
    planFreeName: 'Free',
    planFreeDesc: 'Get started at no cost.',
    planFreeItem1: '5 guides / month',
    planFreeItem2: 'Standard step output',
    planFreeItem3: 'Web access',
    planFreeItem4: 'Community support',
    planFreeGetStarted: 'Get started',
    planProName: 'Pro',
    planProDesc: 'For working technicians.',
    planProItem1: 'Unlimited guides',
    planProItem2: 'Priority image jobs',
    planProItem3: 'Web + mobile',
    planProItem4: 'API access',
    planProItem5: 'Email support',
    planProStartTrial: 'Start trial',
    planProMostPopular: 'Most popular',
    planEntName: 'Enterprise',
    planEntDesc: 'For fleets and workshops.',
    planEntItem1: 'Tenant isolation',
    planEntItem2: 'Custom manual ingestion',
    planEntItem3: 'Admin dashboard',
    planEntItem4: 'SLA guarantee',
    planEntItem5: 'Dedicated support',
    planEntContactUs: 'Contact us',
    planPerMonth: '/mo',
    planCustom: 'Custom',
    ctaEyebrow: 'Get started today',
    ctaTitle: 'Generate your first repair guide free.',
    ctaSub: 'No credit card. No setup. Just results.',
    ctaStartTrial: 'Start trial',
    ctaAlreadyHaveAccount: 'Already have an account →',
    demoSourceLabel: 'Haynes Workshop Manual',
    demoOemVerified: 'OEM Verified',
    demoVehicle1: 'BMW E90 330d',
    demoTitle1: 'Brake Caliper — Cross Section',
    demoViewBadge: 'Engineering View',
    demoTime1: '45 min',
    demoTools1: '8 tools',
    demoSteps1: '10 steps',
    demoSafety1: '3 safety notes',
    demoProcTitle: 'Brake Pad Replacement',
    demoProcStep: '3 / 10',
    demoProcVehicle: 'Nissan Qashqai J10 · 2019',
    demoStep1: 'Remove wheel & dust cap',
    demoStep2: 'Loosen caliper guide bolts',
    demoStep3: 'Compress caliper piston',
    demoStep4: 'Fit new brake pads',
    demoStep5: 'Torque bolts · 35 Nm',
    demoAiOrganized: '✦ AI organized',
    demoTime2: '90–120 min',
    demoTorqueTag: 'Torque: 35 Nm',
    demoVerifiedTag: 'Manual verified',
  },

  authModal: {
    title: 'Sign in to search',
    sub: 'Create a free account to generate guides, or try 3 real sample guides as a guest.',
    createAccount: 'Create account',
    signIn: 'Sign in',
    continueAsGuest: 'Continue as guest',
    guestLoadingText: 'Loading…',
    guestNote: 'Guests see 3 real sample guides in read-only demo mode.',
  },

  auth: {
    welcomeBack: 'Welcome back',
    noAccount: 'No account?',
    createOneFree: 'Create one free',
    forgotPassword: 'Forgot password?',
    signingIn: 'Signing in…',
    createAccount: 'Create account',
    alreadyHaveAccount: 'Already have an account?',
    passwordMinLength: 'min 8 characters',
    creatingAccount: 'Creating account…',
    continueAsGuest: 'Continue as guest',
    loginFailed: 'Login failed',
    signupFailed: 'Signup failed',
    guestFailed: 'Failed to continue as guest',
  },

  onboarding: {
    welcomeHeading: 'Welcome to Motixi',
    welcomeSub: 'AI-powered repair guides that know your vehicle, your parts, and your job — all in one place.',
    featuresHeading: 'Everything you need to fix it right',
    featuresSub: 'From oil changes to timing belts — Motixi generates precise, step-by-step guides with AI illustrations.',
    feat1title: 'Step-by-step guides',
    feat1desc: 'Auto-generated from OEM data and trusted sources',
    feat2title: 'AI illustrations',
    feat2desc: 'Visual reference for every repair step',
    feat3title: 'Ask the guide',
    feat3desc: 'Get instant answers to repair questions',
    choosePlanHeading: 'Choose your plan',
    choosePlanSub: 'Try Pro free for 7 days or start with the free plan.',
    planTrialName: '7-day free trial',
    planTrialDesc: 'Full access — AI illustrations, OEM-backed guides, unlimited repairs.',
    planTrialBadge: 'Recommended',
    planTrialNote: 'Card required. No charge today — cancel anytime before trial ends. Renews at $39/mo.',
    planPremiumName: 'Premium',
    planPremiumDesc: 'Full access immediately. Best for shops and serious techs.',
    planFreeName: 'Free (limited)',
    planFreeDesc: 'Basic guide generation. No AI illustrations, limited history.',
    startMyFreeTrial: 'Start my free trial',
    getPremiumAccess: 'Get Premium access',
    continueFree: 'Continue free',
    settingUp: 'Setting up…',
    skipToPlanSelection: 'Skip to plan selection',
    somethingWentWrong: 'Something went wrong. Please try again.',
  },

  dash: {
    sampleGuides: 'Sample Guides',
    guidesTitle: 'Guides',
    guidesSub: 'Your AI-generated repair guides',
    sampleGuidesSub: '3 real guides generated by Motixi — read-only demo',
    newGuide: 'New Guide',
    guestBanner: "You're in demo mode — these are real guides.",
    guestBannerLink: 'Create a free account',
    guestBannerSuffix: 'to generate your own.',
    thisMonth: 'This month',
    timeSaved: 'Time saved',
    topRepair: 'Top repair',
    searchGuides: 'Search guides…',
    filterSampleGuides: 'Filter sample guides…',
    allDifficulties: 'All difficulties',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    expert: 'Expert',
    mostRecent: 'Most recent',
    aToZ: 'A → Z',
    loadingGuides: 'Loading guides…',
    noSampleMatch: 'No sample guides match that filter',
    noSampleMatchSub: 'Try a different keyword or clear the filter.',
    clearFilter: 'Clear filter',
    noResultsFor: 'No results for',
    noResultsSub: 'Try a different search term.',
    couldNotLoadGuides: 'Could not load guides',
    noGuidesYet: 'No guides yet',
    noGuidesYetSub: 'Click New Guide to generate your first AI-powered repair guide.',
    deleteGuide: 'Delete guide',
    imagesGenerating: 'Images generating',
    imagesFailed: 'Image generation failed',
    ready: 'Ready',
  },

  garage: {
    title: 'Vehicles',
    sub: 'Vehicles from your repair history',
    noVehiclesYet: 'No vehicles yet',
    noVehiclesSub: 'Generate a guide to add a vehicle.',
    guideCount: 'guide',
    guidesCount: 'guides',
  },

  jobs: {
    title: 'Jobs',
    sub: 'Track active repair jobs',
    logRepairJob: 'Log repair job',
    problemDescription: 'Problem description',
    notes: 'Notes',
    additionalContext: 'Additional context',
    selectVehicle: 'Select vehicle…',
    createJob: 'Create job',
    creating: 'Creating…',
    noJobsYet: 'No repair jobs yet',
    noJobsSub: 'Log your first job above.',
    pending: 'Pending',
    inProgress: 'In progress',
    completed: 'Completed',
    start: 'Start',
    complete: 'Complete',
    guideLabel: 'Guide:',
  },

  requests: {
    title: 'Requests',
    sub: 'Request guides for your fleet',
    requestAGuide: 'Request a guide',
    vehicleModel: 'Vehicle model',
    repairType: 'Repair type',
    partNumber: 'Part number',
    notes: 'Notes',
    additionalContext: 'Additional context',
    submitRequest: 'Submit request',
    submitting: 'Submitting…',
    noRequestsYet: 'No requests yet',
    noRequestsSub: 'Submit a guide request above.',
    guideReady: 'Guide ready:',
  },

  manuals: {
    title: 'Manuals Library',
    sub: 'Upload OEM manuals and generate guides from your own documentation',
    uploadManual: 'Upload manual',
    titleField: 'Title',
    pdfUrl: 'PDF URL',
    vehicleModel: 'Vehicle model',
    extractedText: 'Extracted text',
    saveManual: 'Save manual',
    saving: 'Saving…',
    generateFromManual: 'Generate from manual',
    selectManual: 'Select manual…',
    partName: 'Part name',
    oemNumber: 'OEM number',
    generateGuide: 'Generate guide',
    generating: 'Generating…',
    guideReady: 'Guide ready:',
    uploadedManuals: 'Uploaded manuals',
    noManualsUploaded: 'No manuals uploaded',
    noManualsSub: 'Upload a PDF manual above to get started.',
    manual: 'Manual',
  },

  settingsView: {
    title: 'Settings',
    sub: 'Account and billing',
    account: 'Account',
    emailLabel: 'Email',
    planLabel: 'Plan',
    trialEndsIn: 'Trial ends in',
    day: 'day',
    days: 'days',
    planAndUsage: 'Plan & Usage',
    planPro: 'Plan — Pro',
    proActive: 'Pro plan active',
    proActiveDesc: 'Unlimited guides · Priority image generation · API access',
    trialActive: 'Pro trial active',
    trialRenewsAs: 'Renews as Pro ($39/mo) after trial unless canceled.',
    manageSubscription: 'Manage subscription',
    startTrialCta: 'Start 7-day free trial — $39/mo after',
    guidesThisMonth: 'Guides this month',
    havePromoCode: 'Have a promo code?',
    enterCode: 'Enter code…',
    apply: 'Apply',
    promoApplied: '🎉 Promo applied! You now have Pro access.',
    invalidPromoCode: 'Invalid promo code',
  },

  sidebar: {
    sampleGuides: 'Sample Guides',
    createFreeAccount: 'Create free account',
    newGuide: 'New Guide',
    workshop: 'WORKSHOP',
    jobs: 'Jobs',
    requests: 'Requests',
    analytics: 'Analytics',
    account: 'ACCOUNT',
    settings: 'Settings',
    exitDemo: 'Exit demo',
    logOut: 'Log out',
    enterprise: 'Enterprise',
    pro: 'Pro ✓',
    trial: 'Pro Trial',
    free: 'Free',
    limitReached: 'limit reached',
    upgrade: 'upgrade',
  },

  guideForm: {
    aiGenerated: 'AI Generated',
    sourceBacked: 'Source-Backed',
    step1title: 'Step 1 of 3 — Choose your vehicle',
    manualEntry: 'Manual entry',
    vinDecode: 'VIN decode',
    vinOptional: 'VIN',
    vinNumber: 'VIN number',
    decode: 'Decode',
    vinError11: 'Enter at least 11 characters',
    couldNotDecodeVin: 'Could not decode VIN — check the number and try again',
    networkError: 'Network error — check your connection',
    step2title: 'Step 2 of 3 — What needs repair?',
    partRepairDesc: 'Part / repair description',
    partPlaceholder: 'e.g. Hydraulic pump, brakes, oil change…',
    didYouMean: 'Did you mean:',
    oemPartNumber: 'OEM / part number',
    review: 'Review',
    step3title: 'Step 3 of 3 — Confirm & generate',
    vehicleLabel: 'Vehicle',
    vinLabel: 'VIN',
    repairLabel: 'Repair',
    partNoLabel: 'Part No.',
    generateGuide: 'Generate Guide',
    generatingGuide: 'Generating…',
    sourceTitle: 'Source-backed guide',
    sourceBadge: 'Nissan & Toyota',
    sourceDesc: 'Guides are synthesised from NICOclub and ToyoDIY verified service manual data.',
    make: 'Make',
    model: 'Model',
    year: 'Year',
    task: 'Task',
    selectModel: 'Select model…',
    selectYear: 'Select year…',
    selectTask: 'Select task…',
    source: 'Source:',
    sourceNissan: 'NICOclub service manual',
    sourceToyota: 'ToyoDIY component reference',
    generateFromSource: 'Generate from source',
    synthesisingFromSource: 'Synthesising from source…',
    taskOilChange: 'Engine oil & filter change',
    taskBrakePad: 'Brake pad replacement',
    taskBrakeFluid: 'Brake fluid flush',
    continue: 'Continue',
    back: 'Back',
    edit: 'Edit',
  },

  guideDetail: {
    backToGuides: 'Back to Guides',
    overview: 'Overview',
    difficulty: 'Difficulty',
    timeEstimate: 'Time estimate',
    stepsLabel: 'Steps',
    toolsRequired: 'Tools required',
    safetyWarnings: 'Safety warnings',
    step: 'Step',
    stepOf: 'of',
    previous: 'Previous',
    next: 'Next',
    done: 'Done',
    preparingIllustration: 'Preparing illustration…',
    generatingImage: 'Generating image…',
    imageReady: 'Image ready',
    imageFailed: 'Image generation failed',
    generateImage: 'Generate image',
    noImageAvailable: 'No image available',
    procedure: 'PROCEDURE',
    moreTools: 'more',
    showLess: 'Show less',
    safetyNotes: 'Safety notes',
    nSafetyNotes: 'safety notes',
    sourceReferences: 'SOURCE REFERENCES',
    prev: 'Prev',
    torque: 'Torque',
    confidence: 'confidence',
    expand: 'Expand',
    fallbackIllustration: 'Fallback illustration',
    regenerate: 'Regenerate',
    retryIllustration: 'Retry illustration',
    queuedStatus: 'Queued…',
    searchingRefs: 'Searching references…',
    analyzingRefs: 'Analysing diagram layout…',
    generatingStatus: 'Generating illustration…',
    aiIllustration: 'AI illustration',
    availableForRegistered: 'Available for registered users',
    createFreeAccount: 'Create free account',
    createAccountToContinue: 'Create an account to continue',
    upgradeDesc: 'Ask follow-up questions, save guides, and unlock full functionality.',
    signIn: 'Sign in',
    askAiAboutStep: 'Ask AI about this step',
    askAi: 'Ask AI',
    askPlaceholder: 'e.g. What torque should I use here?',
    ask: 'Ask',
    aiExplanationError: 'Could not get an AI explanation at this time.',
    errorLoadMsg: 'This guide could not be loaded. It may have been deleted or is temporarily unavailable.',
    sourceBackedLabel: 'Source-Backed',
    webSynthesisLabel: 'Web Synthesis',
    aiGeneratedLabel: 'AI Generated',
  },

  profilePage: {
    title: 'Your Profile',
    sub: 'Manage your account information and preferences.',
    accountSection: 'Account',
    firstName: 'First name',
    lastName: 'Last name',
    emailLabel: 'Email',
    primaryVehicle: 'Primary vehicle',
    yourPlan: 'Your plan',
    freePlan: '⚡ Free Plan',
    proPlan: '⚡ Pro Plan — $39/mo',
    enterprisePlan: '🏢 Enterprise Plan',
    guidesThisMonth: 'Guides this month',
    imageGeneration: 'Image generation',
    upgradeToProPrice: 'Upgrade to Pro — $39/mo →',
    unlimited: 'Unlimited',
    priorityImage: 'Priority',
    mobileEnabled: 'Mobile app: Enabled',
    apiEnabled: 'API access: Enabled',
    nextBilling: 'Next billing',
    manageSubscription: 'Manage subscription',
    teamMembers: 'Team members: 4 / 10',
    manualsUploaded: 'Manuals uploaded: 2',
    customSla: 'Custom SLA: Enabled',
    accountManager: 'Account manager',
    contactSupport: 'Contact support',
    preferences: 'Preferences',
    country: 'Country',
    preferredBrands: 'Preferred brands',
    billingDetails: 'Billing details',
    currentPlan: 'Current plan',
    nextBillingDate: 'Next billing date',
    paymentMethod: 'Payment method on file',
    cardEndingIn: 'Card ending in',
    noPaymentMethod: 'No payment method added',
    addPaymentMethod: 'Add payment method',
    companyName: 'Company name',
    billingEmail: 'Billing email',
    vatTaxId: 'VAT / Tax ID',
    billingAddress: 'Billing address',
    billingHistory: 'Billing history',
    upgradeToPro: 'Upgrade to Pro',
    saved: '✓ Saved',
    saveProfile: 'Save profile',
    perMonth: '/mo',
    active: 'Active',
    organization: 'Organization',
  },

  navAuth: {
    dashboard: 'Dashboard',
    profile: 'Profile',
    settings: 'Settings',
    logOut: 'Log out',
    logIn: 'Log in',
    startTrial: 'Start trial',
  },

  dashboard: {
    trialStartedNotice: 'Your 7-day Pro trial is now active! Enjoy full access.',
    proActivatedNotice: 'Pro plan activated! You now have unlimited access.',
    billingCancelledNotice: 'Checkout was cancelled. You can start your trial anytime from Settings.',
  },

  vehicleSelector: {
    brand: 'Brand',
    model: 'Model',
    year: 'Year',
    selectBrand: 'Select brand…',
    selectModel: 'Select model…',
    selectYear: 'Select year…',
    loading: 'Loading…',
  },

  heroActions: {
    startForFree: 'Start for free',
    viewDashboard: 'View dashboard',
  },

  forgotPassword: {
    title: 'Forgot password?',
    sub: 'Enter your email and we\'ll send a reset token.',
    emailLabel: 'Email',
    sendResetToken: 'Send reset token',
    sending: 'Sending…',
    tokenReady: 'Token ready',
    tokenReadySub: 'In production this would be emailed. Copy and use the token below.',
    tokenNote: 'Tap to select all · valid for 15 minutes',
    continueToReset: 'Continue to reset password',
    backToSignIn: 'Back to sign in',
  },

  resetPassword: {
    title: 'Reset password',
    backToSignIn: 'Back to sign in',
    resetTokenLabel: 'Reset token',
    pasteToken: 'Paste your reset token here',
    newPassword: 'New password',
    confirmNewPassword: 'Confirm new password',
    updatePassword: 'Update password',
    updating: 'Updating…',
    passwordMinLength: 'Password must be at least 8 characters.',
    passwordsMismatch: 'Passwords do not match.',
    invalidToken: 'Invalid or expired token',
  },

  aboutPage: {
    heroEyebrow: 'About Motixi',
    heroTitle: 'Built for people who\nactually fix things.',
    heroSub: 'Motixi is an AI-powered platform that generates structured repair guides instantly — built by engineers who understand how workshops really operate.',

    storyEyebrow: 'Our Story',
    storyTitle: 'Why we built Motixi',
    storyP1: 'We came from enterprise consulting and software engineering — building platforms for banks, retailers, and tech companies. But when we looked at automotive and heavy equipment, we saw an industry drowning in scattered PDFs, tribal knowledge, and outdated manuals. Technicians deserved better tools.',
    storyP2: 'So we built Motixi: an AI engine that turns a vehicle model and repair description into a complete, step-by-step guide — with torque specs, safety notes, and diagrams — in under 3 seconds. No manual lookup. No guesswork. Just the right procedure, right now.',

    leadershipEyebrow: 'Leadership',
    leadershipTitle: 'The team behind Motixi',
    ceoName: 'Kyrylo Petrov',
    ceoRole: 'Founder & CEO',
    ceoIntro: 'Product-focused entrepreneur building AI-driven platforms for real-world industries.',
    ceoBullets: [
      '10+ years in enterprise consulting and digital transformation',
      'Built platforms for large-scale organizations across finance and retail',
      'Strong focus on product strategy and execution',
      'Founder of Motixi — solving real problems in automotive repair',
    ],
    ctoName: 'Mykhailo',
    ctoRole: 'CTO & Co-Founder',
    ctoIntro: 'Full-stack architect with 20+ years building scalable systems and leading engineering teams.',
    ctoBullets: [
      'Designed and delivered large-scale distributed systems',
      'Deep expertise in backend architecture and system reliability',
      'Leads engineering at Motixi from infrastructure to product delivery',
      'Strong experience in managing and scaling engineering teams',
    ],
    linkedinLabel: 'LinkedIn',
    emailLabel: 'Email',

    whyEyebrow: 'Why We Build',
    whyTitle: 'What drives us every day',
    whyCards: [
      { icon: '⚡', title: 'Speed', desc: 'Guides generated in under 3 seconds. No waiting, no searching, no digging through PDFs.' },
      { icon: '🎯', title: 'Accuracy', desc: 'AI-verified procedures with torque specs, safety warnings, and part numbers — not generic advice.' },
      { icon: '🛠️', title: 'Usability', desc: 'Designed for real workshops — mobile-first, step-by-step, works with grease on your hands.' },
      { icon: '🚫', title: 'No BS', desc: 'No subscriptions to 10 databases. No outdated manuals. One tool that actually works.' },
    ],

    expEyebrow: 'Experience',
    expTitle: 'What we bring to the table',
    expBullets: [
      { label: 'Enterprise delivery', desc: 'Multi-tenant platforms for financial services, retail, and technology — from discovery to production.' },
      { label: 'AI & data platforms', desc: 'AI-driven products from early prototype to scaled production systems serving real users.' },
      { label: 'Automotive & fleet', desc: 'Direct exposure to fleet operations, repair workflows, and the documentation gap Motixi addresses.' },
      { label: 'Full product lifecycle', desc: 'Strategy, roadmap, team structure, go-to-market — from concept to paying customers.' },
      { label: 'Full-stack engineering', desc: 'Production code, API design, mobile apps, infrastructure — no gap between vision and execution.' },
    ],

    ctaQuote: 'The best repair guide is the one that exists at the moment you need it — accurate, structured, and faster than any manual lookup.',
    ctaQuoteAttr: '— Kyrylo Petrov, Founder & CEO',
    ctaTrial: 'Start free trial',
    ctaContact: 'Get in touch →',
  },

  productPage: {
    eyebrow: 'Product',
    title: 'AI repair guides.\nInstant. Structured. Accurate.',
    sub: 'Type a vehicle model and repair description. Get a complete step-by-step procedure — with torque specs, tools, safety warnings, and engineering diagrams — in under 3 seconds.',
    startTrial: 'Start trial',
    tryDemo: 'Try demo',
    talkToFounder: 'Talk to founder →',
    guestAuthFailed: 'Could not open demo access. Please try again.',
    walkthroughEyebrow: 'Product walkthrough',
    walkthroughTitle: 'Search to guide in three steps',
    walkthroughSub: 'Available on web and mobile — same AI, same accuracy, any device.',
    step01: 'Step 01',
    step01title: 'Type your query',
    step01desc: 'Natural language or structured — VIN, model name, part number. No special syntax.',
    step02: 'Step 02',
    step02title: 'Instant match or generate',
    step02desc: 'Motixi searches the knowledge base first. Matches are instant — new guides in under 3s.',
    step03: 'Step 03',
    step03title: 'Follow step-by-step',
    step03desc: 'Ordered steps, torque specs, tools, warnings. Diagrams render inline as you work.',
    whoEyebrow: 'Who it\'s for',
    whoTitle: 'Built for people who fix things',
    whoSub: 'From solo technicians to enterprise fleet workshops.',
    forCards: [
      { icon: '🔧', label: 'Independent technicians', desc: 'Find the right procedure in seconds — no PDF hunting, no forum guessing, no mis-matched specs.' },
      { icon: '🏭', label: 'Fleet workshops', desc: 'Standardize repair procedures across your team with consistent, AI-generated step sequences.' },
      { icon: '🚛', label: 'Heavy equipment operators', desc: 'Guides for excavators, cranes, and specialist machinery — not just passenger cars.' },
      { icon: '📋', label: 'Service managers', desc: 'Cut diagnostic time and reduce training overhead with on-demand reference guides.' },
    ],
    guideOutputEyebrow: 'Guide output',
    guideOutputTitle: 'Everything a technician needs, structured',
    guideOutputSub: 'Every generated guide includes these elements — not stripped-down summaries.',
    guideOutputs: [
      'Ordered step sequence', 'Torque specifications', 'Required tools list',
      'OEM part references', 'Safety warnings', 'Engineering diagrams',
      'Difficulty rating', 'Time estimate',
    ],
    whyEyebrow: 'Why Motixi',
    whyTitle: 'Not a chatbot. Not a manual.\nSomething better.',
    differentiators: [
      { vs: 'vs PDF manuals', title: 'Searchable. Instant. Structured.', desc: 'No downloading. No scrolling through 400 pages. Natural language in, structured procedure out.' },
      { vs: 'vs forum threads', title: 'Authoritative, not anecdotal', desc: 'Engineered from AI knowledge — not forum opinions that may not match your exact vehicle trim.' },
      { vs: 'vs generic AI chat', title: 'Domain-aware output', desc: 'Motixi is built for automotive repair. It understands torque specs, OEM references, and tool requirements.' },
    ],
    ctaEyebrow: 'Get started today',
    ctaTitle: 'Generate your first repair guide free.',
    ctaSub: 'No credit card. No setup. Just results.',
    alreadyHaveAccount: 'Already have an account →',
  },

  contactPage: {
    eyebrow: 'Contact',
    title: 'Let\'s talk',
    sub: 'For partnerships, enterprise deployments, consulting, product strategy, or any questions about Motixi — I respond personally.',
    founderName: 'Kyrylo Petrov',
    founderRole: 'Founder & CEO, Motixi',
    email: 'Email',
    linkedin: 'LinkedIn',
    getInTouchTitle: 'Get in touch directly',
    getInTouchP1: 'I respond personally to every message. Whether you\'re evaluating Motixi for your workshop, exploring an enterprise deployment, looking for a consulting conversation, or just want to discuss the problem space — I\'m reachable.',
    getInTouchP2: 'The fastest path is email. LinkedIn works too for a more formal introduction.',
    responseNote: 'Usually responds within 24 hours.',
  },

  newGuide: {
    backToGuides: 'Back to Guides',
  },

  countrySelector: {
    title: 'Choose your region',
    sub: 'This sets the language for the app. You can change it later in settings.',
    confirm: 'Continue',
  },

  footer: {
    product: 'Product',
    about: 'About',
    contact: 'Contact',
    email: 'Email',
  },

  time: {
    justNow: 'just now',
    minutesAgo: 'm ago',
    hoursAgo: 'h ago',
    yesterday: 'yesterday',
    daysAgo: 'd ago',
  },
};

// ── Ukrainian ────────────────────────────────────────────────────────────────

const uk: Translations = {
  common: {
    appName: 'Motixi',
    search: 'Пошук',
    back: 'Назад',
    continue_: 'Далі',
    save: 'Зберегти',
    cancel: 'Скасувати',
    delete_: 'Видалити',
    edit: 'Редагувати',
    retry: 'Повторити',
    loading: 'Завантаження…',
    or: 'або',
    all: 'Всі',
    optional: 'необов\'язково',
    required: '*',
    email: 'Електронна пошта',
    password: 'Пароль',
    logOut: 'Вийти',
    logIn: 'Увійти',
    signIn: 'Увійти',
    signUp: 'Реєстрація',
    guides: 'Інструкції',
    steps: 'кроків',
    vehicle: 'Транспорт',
    vehicles: 'Транспорт',
    settings: 'Налаштування',
    profile: 'Профіль',
    dashboard: 'Панель',
    copyrightNotice: '© 2026 Motixi. Усі права захищені.',
    product: 'Продукт',
    about: 'Про нас',
    contacts: 'Контакти',
  },

  nav: {
    howItWorks: 'Як це працює',
    features: 'Можливості',
    pricing: 'Ціни',
    startTrial: 'Спробувати',
    openNavigation: 'Відкрити меню',
    closeNavigation: 'Закрити меню',
  },

  landing: {
    heroEyebrow: 'ШІ Ремонтний Інтелект',
    heroTitle: 'База знань з ремонту',
    heroTitleGrad: 'для кожного транспорту.',
    heroSub: 'Задайте будь-яке питання щодо ремонту. Motixi шукає у базі знань — якщо інструкція є, ви отримаєте її миттєво. Якщо ні — ШІ згенерує її та збереже для всіх.',
    searchPlaceholder: 'Пошук за транспортом, проблемою або деталлю…',
    tryLabel: 'Спробуйте:',
    recentLabel: 'Нещодавно:',
    popularRepairs: 'Популярні ремонти',
    guidesCount: 'інструкцій',
    trustedBy: 'Нам довіряють команди',
    howEyebrow: 'Як це працює',
    howTitle: 'Від запиту до інструкції за чотири кроки',
    step01title: 'Пошук або запитання',
    step01text: 'Введіть модель транспорту та опис ремонту — або запитайте природною мовою, наприклад "bmw e90 заміна масла".',
    step02title: 'ШІ шукає у базі знань',
    step02text: 'Motixi перевіряє тисячі збережених інструкцій перед генерацією нових.',
    step03title: 'Миттєвий результат або нова інструкція',
    step03text: 'Отримайте існуючу інструкцію менш ніж за секунду, або ШІ згенерує нову за 3 секунди.',
    step04title: 'Дотримуйтесь покроково',
    step04text: 'Відкрийте інструкцію на вебі або мобільному і виконуйте з інженерними діаграмами.',
    statGeneration: 'Генерація інструкції',
    statSteps: 'Кроків в інструкції',
    statAiGenerated: 'Згенеровано ШІ',
    statVehicleModels: 'Моделі транспорту',
    featuresEyebrow: 'Можливості',
    featuresTitle: 'Все, що потрібно технікові',
    featuresSub: 'Створено для швидкості, точності та реальних умов майстерні.',
    feat1title: 'Миттєва генерація',
    feat1desc: 'VIN або модель + номер деталі → повна структурована інструкція за 3 секунди.',
    feat2title: 'Покрокова точність',
    feat2desc: '8–15 впорядкованих кроків з моментами затяжки, інструментами та попередженнями безпеки.',
    feat3title: 'Інженерні діаграми',
    feat3desc: 'ШІ-генеровані технічні діаграми для кожного кроку.',
    feat4title: 'Веб та мобільний',
    feat4desc: 'Єдиний бекенд для вебпанелі та мобільного Flutter-додатку.',
    feat5title: 'Фонова черга завдань',
    feat5desc: 'Генерація зображень працює асинхронно з відстеженням статусу в реальному часі.',
    feat6title: 'Готово для підприємств',
    feat6desc: 'Ізоляція тенантів, завантаження мануалів, контроль доступу та адмін-панель.',
    mobileEyebrow: 'Мобільний додаток',
    mobileTitle: 'Інструкції з ремонту\nу вашій кишені',
    mobileSub: 'Ті ж ШІ-генеровані інструкції з ремонту, оптимізовані для мобільного. Гортайте кроки, масштабуйте діаграми, відстежуйте прогрес — працює офлайн.',
    mobileBullet1: 'Гортайте кроки однією рукою',
    mobileBullet2: 'Масштабуйте інженерні діаграми',
    mobileBullet3: 'Офлайн-режим для майстерні',
    mobileEarlyAccess: 'Отримати ранній доступ',
    mobileComingSoon: 'Скоро на iOS та Android',
    phoneMyWorkspace: 'Мій робочий простір',
    phoneGuides: 'Інструкції',
    phoneGuidesCount: '3 інструкції · цього тижня',
    phoneSearchGuides: 'Пошук інструкцій…',
    phoneRecent: 'Нещодавні',
    phoneGarage: 'Гараж',
    phoneProfile: 'Профіль',
    phoneBack: 'Назад',
    phoneToolsRequired: 'Необхідні інструменти',
    phoneSafetyNotes: 'Примітки безпеки',
    phoneSafetyLine1: 'Відключіть акумулятор та гідравлічний тиск перед розбиранням.',
    phoneSafetyLine2: 'Використовуйте домкратні стійки та упори на рівній поверхні.',
    phoneStepOf: 'КРОК 1 З 10',
    phoneOfSteps: 'з 10 кроків',
    pricingEyebrow: 'Ціни',
    pricingTitle: 'Прості та прозорі ціни',
    pricingSub: 'Почніть безкоштовно. Оновіть, коли потрібно більше.',
    planFreeName: 'Безкоштовний',
    planFreeDesc: 'Почніть без витрат.',
    planFreeItem1: '5 інструкцій / місяць',
    planFreeItem2: 'Стандартний вивід',
    planFreeItem3: 'Доступ через веб',
    planFreeItem4: 'Підтримка спільноти',
    planFreeGetStarted: 'Почати',
    planProName: 'Pro',
    planProDesc: 'Для працюючих техніків.',
    planProItem1: 'Безлімітні інструкції',
    planProItem2: 'Пріоритетні зображення',
    planProItem3: 'Веб + мобільний',
    planProItem4: 'Доступ до API',
    planProItem5: 'Підтримка по email',
    planProStartTrial: 'Спробувати',
    planProMostPopular: 'Найпопулярніший',
    planEntName: 'Enterprise',
    planEntDesc: 'Для автопарків та майстерень.',
    planEntItem1: 'Ізоляція тенантів',
    planEntItem2: 'Завантаження мануалів',
    planEntItem3: 'Адмін-панель',
    planEntItem4: 'Гарантія SLA',
    planEntItem5: 'Виділена підтримка',
    planEntContactUs: 'Зв\'язатися з нами',
    planPerMonth: '/міс',
    planCustom: 'За запитом',
    ctaEyebrow: 'Почніть сьогодні',
    ctaTitle: 'Згенеруйте першу інструкцію безкоштовно.',
    ctaSub: 'Без кредитної картки. Без налаштування. Тільки результат.',
    ctaStartTrial: 'Спробувати',
    ctaAlreadyHaveAccount: 'Вже є акаунт →',
    demoSourceLabel: 'Сервісний посібник Haynes',
    demoOemVerified: 'OEM перевірено',
    demoVehicle1: 'BMW E90 330d',
    demoTitle1: 'Гальмівний супорт — переріз',
    demoViewBadge: 'Інженерний вид',
    demoTime1: '45 хв',
    demoTools1: '8 інструментів',
    demoSteps1: '10 кроків',
    demoSafety1: '3 примітки безпеки',
    demoProcTitle: 'Заміна гальмівних колодок',
    demoProcStep: '3 / 10',
    demoProcVehicle: 'Nissan Qashqai J10 · 2019',
    demoStep1: 'Зніміть колесо і ковпачок',
    demoStep2: 'Відкрутіть напрямні болти супорта',
    demoStep3: 'Стисніть поршень супорта',
    demoStep4: 'Встановіть нові колодки',
    demoStep5: 'Затягніть болти · 35 Нм',
    demoAiOrganized: '✦ AI організовано',
    demoTime2: '90–120 хв',
    demoTorqueTag: 'Момент: 35 Нм',
    demoVerifiedTag: 'Перевірено за посібником',
  },

  authModal: {
    title: 'Увійдіть для пошуку',
    sub: 'Створіть безкоштовний акаунт для генерації інструкцій або спробуйте 3 демо-інструкції як гість.',
    createAccount: 'Створити акаунт',
    signIn: 'Увійти',
    continueAsGuest: 'Продовжити як гість',
    guestLoadingText: 'Завантаження…',
    guestNote: 'Гості бачать 3 реальні інструкції в режимі перегляду.',
  },

  auth: {
    welcomeBack: 'З поверненням',
    noAccount: 'Немає акаунту?',
    createOneFree: 'Створити безкоштовно',
    forgotPassword: 'Забули пароль?',
    signingIn: 'Вхід…',
    createAccount: 'Створити акаунт',
    alreadyHaveAccount: 'Вже є акаунт?',
    passwordMinLength: 'мінімум 8 символів',
    creatingAccount: 'Створення акаунту…',
    continueAsGuest: 'Продовжити як гість',
    loginFailed: 'Помилка входу',
    signupFailed: 'Помилка реєстрації',
    guestFailed: 'Не вдалося продовжити як гість',
  },

  onboarding: {
    welcomeHeading: 'Ласкаво просимо до Motixi',
    welcomeSub: 'ШІ-інструкції з ремонту, які знають ваш транспорт, деталі та роботу — все в одному місці.',
    featuresHeading: 'Все для правильного ремонту',
    featuresSub: 'Від заміни масла до ременя ГРМ — Motixi генерує точні покрокові інструкції з ШІ-ілюстраціями.',
    feat1title: 'Покрокові інструкції',
    feat1desc: 'Автогенерація з даних OEM та перевірених джерел',
    feat2title: 'ШІ-ілюстрації',
    feat2desc: 'Візуальна довідка для кожного кроку ремонту',
    feat3title: 'Запитайте інструкцію',
    feat3desc: 'Отримайте миттєві відповіді на питання з ремонту',
    choosePlanHeading: 'Оберіть план',
    choosePlanSub: 'Спробуйте Pro безкоштовно 7 днів або почніть з безкоштовного плану.',
    planTrialName: '7-денний пробний період',
    planTrialDesc: 'Повний доступ — ШІ-ілюстрації, інструкції з OEM-даних, необмежені ремонти.',
    planTrialBadge: 'Рекомендовано',
    planTrialNote: 'Потрібна картка. Без оплати сьогодні — скасуйте будь-коли до закінчення пробного періоду. Поновлення за $39/міс.',
    planPremiumName: 'Преміум',
    planPremiumDesc: 'Повний доступ одразу. Найкраще для майстерень та серйозних техніків.',
    planFreeName: 'Безкоштовний (обмежений)',
    planFreeDesc: 'Базова генерація інструкцій. Без ШІ-ілюстрацій, обмежена історія.',
    startMyFreeTrial: 'Почати пробний період',
    getPremiumAccess: 'Отримати Преміум доступ',
    continueFree: 'Продовжити безкоштовно',
    settingUp: 'Налаштування…',
    skipToPlanSelection: 'Перейти до вибору плану',
    somethingWentWrong: 'Щось пішло не так. Спробуйте ще раз.',
  },

  dash: {
    sampleGuides: 'Демо-інструкції',
    guidesTitle: 'Інструкції',
    guidesSub: 'Ваші ШІ-генеровані інструкції з ремонту',
    sampleGuidesSub: '3 реальні інструкції від Motixi — режим перегляду',
    newGuide: 'Нова інструкція',
    guestBanner: 'Ви в демо-режимі — це реальні інструкції.',
    guestBannerLink: 'Створіть безкоштовний акаунт',
    guestBannerSuffix: 'щоб генерувати свої.',
    thisMonth: 'Цього місяця',
    timeSaved: 'Збережений час',
    topRepair: 'Топ ремонт',
    searchGuides: 'Пошук інструкцій…',
    filterSampleGuides: 'Фільтр демо-інструкцій…',
    allDifficulties: 'Всі рівні',
    beginner: 'Початківець',
    intermediate: 'Середній',
    advanced: 'Просунутий',
    expert: 'Експерт',
    mostRecent: 'Найновіші',
    aToZ: 'А → Я',
    loadingGuides: 'Завантаження інструкцій…',
    noSampleMatch: 'Жодна демо-інструкція не відповідає фільтру',
    noSampleMatchSub: 'Спробуйте інше ключове слово або очистіть фільтр.',
    clearFilter: 'Очистити фільтр',
    noResultsFor: 'Немає результатів для',
    noResultsSub: 'Спробуйте інший пошуковий запит.',
    couldNotLoadGuides: 'Не вдалося завантажити інструкції',
    noGuidesYet: 'Ще немає інструкцій',
    noGuidesYetSub: 'Натисніть Нова інструкція, щоб згенерувати першу ШІ-інструкцію з ремонту.',
    deleteGuide: 'Видалити інструкцію',
    imagesGenerating: 'Зображення генеруються',
    imagesFailed: 'Помилка генерації зображень',
    ready: 'Готово',
  },

  garage: {
    title: 'Транспорт',
    sub: 'Транспорт з вашої історії ремонтів',
    noVehiclesYet: 'Ще немає транспорту',
    noVehiclesSub: 'Згенеруйте інструкцію, щоб додати транспорт.',
    guideCount: 'інструкція',
    guidesCount: 'інструкцій',
  },

  jobs: {
    title: 'Роботи',
    sub: 'Відстежуйте активні ремонтні роботи',
    logRepairJob: 'Записати ремонтну роботу',
    problemDescription: 'Опис проблеми',
    notes: 'Примітки',
    additionalContext: 'Додатковий контекст',
    selectVehicle: 'Оберіть транспорт…',
    createJob: 'Створити роботу',
    creating: 'Створення…',
    noJobsYet: 'Ще немає ремонтних робіт',
    noJobsSub: 'Запишіть першу роботу вище.',
    pending: 'Очікує',
    inProgress: 'В процесі',
    completed: 'Завершено',
    start: 'Почати',
    complete: 'Завершити',
    guideLabel: 'Інструкція:',
  },

  requests: {
    title: 'Запити',
    sub: 'Запитуйте інструкції для вашого автопарку',
    requestAGuide: 'Запит інструкції',
    vehicleModel: 'Модель транспорту',
    repairType: 'Тип ремонту',
    partNumber: 'Номер деталі',
    notes: 'Примітки',
    additionalContext: 'Додатковий контекст',
    submitRequest: 'Надіслати запит',
    submitting: 'Надсилання…',
    noRequestsYet: 'Ще немає запитів',
    noRequestsSub: 'Надішліть запит на інструкцію вище.',
    guideReady: 'Інструкція готова:',
  },

  manuals: {
    title: 'Бібліотека мануалів',
    sub: 'Завантажуйте OEM-мануали та генеруйте інструкції з вашої документації',
    uploadManual: 'Завантажити мануал',
    titleField: 'Назва',
    pdfUrl: 'URL PDF',
    vehicleModel: 'Модель транспорту',
    extractedText: 'Витягнутий текст',
    saveManual: 'Зберегти мануал',
    saving: 'Збереження…',
    generateFromManual: 'Генерувати з мануалу',
    selectManual: 'Оберіть мануал…',
    partName: 'Назва деталі',
    oemNumber: 'OEM номер',
    generateGuide: 'Генерувати інструкцію',
    generating: 'Генерація…',
    guideReady: 'Інструкція готова:',
    uploadedManuals: 'Завантажені мануали',
    noManualsUploaded: 'Мануали не завантажені',
    noManualsSub: 'Завантажте PDF-мануал вище, щоб почати.',
    manual: 'Мануал',
  },

  settingsView: {
    title: 'Налаштування',
    sub: 'Акаунт та білінг',
    account: 'Акаунт',
    emailLabel: 'Електронна пошта',
    planLabel: 'План',
    trialEndsIn: 'Пробний період закінчується через',
    day: 'день',
    days: 'днів',
    planAndUsage: 'План та використання',
    planPro: 'План — Pro',
    proActive: 'Pro план активний',
    proActiveDesc: 'Безлімітні інструкції · Пріоритетна генерація зображень · Доступ до API',
    trialActive: 'Pro пробний період активний',
    trialRenewsAs: 'Поновлюється як Pro ($39/міс) після пробного періоду, якщо не скасувати.',
    manageSubscription: 'Керувати підпискою',
    startTrialCta: '7 днів безкоштовно — потім $39/міс',
    guidesThisMonth: 'Інструкції цього місяця',
    havePromoCode: 'Маєте промокод?',
    enterCode: 'Введіть код…',
    apply: 'Застосувати',
    promoApplied: '🎉 Промокод застосовано! Тепер у вас Pro доступ.',
    invalidPromoCode: 'Недійсний промокод',
  },

  sidebar: {
    sampleGuides: 'Демо-інструкції',
    createFreeAccount: 'Створити акаунт',
    newGuide: 'Нова інструкція',
    workshop: 'МАЙСТЕРНЯ',
    jobs: 'Роботи',
    requests: 'Запити',
    analytics: 'Аналітика',
    account: 'АКАУНТ',
    settings: 'Налаштування',
    exitDemo: 'Вийти з демо',
    logOut: 'Вийти',
    enterprise: 'Enterprise',
    pro: 'Pro ✓',
    trial: 'Pro Trial',
    free: 'Безкоштовний',
    limitReached: 'ліміт вичерпано',
    upgrade: 'оновити',
  },

  guideForm: {
    aiGenerated: 'ШІ Генерація',
    sourceBacked: 'З джерела',
    step1title: 'Крок 1 з 3 — Оберіть транспорт',
    manualEntry: 'Ручний ввід',
    vinDecode: 'Декодування VIN',
    vinOptional: 'VIN',
    vinNumber: 'VIN номер',
    decode: 'Декодувати',
    vinError11: 'Введіть щонайменше 11 символів',
    couldNotDecodeVin: 'Не вдалося декодувати VIN — перевірте номер і спробуйте знову',
    networkError: 'Помилка мережі — перевірте з\'єднання',
    step2title: 'Крок 2 з 3 — Що потрібно відремонтувати?',
    partRepairDesc: 'Деталь / опис ремонту',
    partPlaceholder: 'напр. Гідравлічний насос, гальма, заміна масла…',
    didYouMean: 'Можливо ви мали на увазі:',
    oemPartNumber: 'OEM / номер деталі',
    review: 'Перевірити',
    step3title: 'Крок 3 з 3 — Підтвердити та генерувати',
    vehicleLabel: 'Транспорт',
    vinLabel: 'VIN',
    repairLabel: 'Ремонт',
    partNoLabel: 'Номер деталі',
    generateGuide: 'Генерувати інструкцію',
    generatingGuide: 'Генерація…',
    sourceTitle: 'Інструкція з джерела',
    sourceBadge: 'Nissan та Toyota',
    sourceDesc: 'Інструкції синтезовані з верифікованих даних сервісних мануалів NICOclub та ToyoDIY.',
    make: 'Марка',
    model: 'Модель',
    year: 'Рік',
    task: 'Завдання',
    selectModel: 'Оберіть модель…',
    selectYear: 'Оберіть рік…',
    selectTask: 'Оберіть завдання…',
    source: 'Джерело:',
    sourceNissan: 'Сервісний мануал NICOclub',
    sourceToyota: 'Компонентний довідник ToyoDIY',
    generateFromSource: 'Генерувати з джерела',
    synthesisingFromSource: 'Синтез з джерела…',
    taskOilChange: 'Заміна моторного масла та фільтра',
    taskBrakePad: 'Заміна гальмівних колодок',
    taskBrakeFluid: 'Прокачка гальмівної рідини',
    continue: 'Продовжити',
    back: 'Назад',
    edit: 'Змінити',
  },

  guideDetail: {
    backToGuides: 'До інструкцій',
    overview: 'Огляд',
    difficulty: 'Складність',
    timeEstimate: 'Час виконання',
    stepsLabel: 'Кроки',
    toolsRequired: 'Необхідні інструменти',
    safetyWarnings: 'Попередження безпеки',
    step: 'Крок',
    stepOf: 'з',
    previous: 'Назад',
    next: 'Далі',
    done: 'Готово',
    preparingIllustration: 'Підготовка ілюстрації…',
    generatingImage: 'Генерація зображення…',
    imageReady: 'Зображення готове',
    imageFailed: 'Помилка генерації зображення',
    generateImage: 'Генерувати зображення',
    noImageAvailable: 'Зображення недоступне',
    procedure: 'ПРОЦЕДУРА',
    moreTools: 'ще',
    showLess: 'Згорнути',
    safetyNotes: 'Примітки безпеки',
    nSafetyNotes: 'приміток безпеки',
    sourceReferences: 'ДЖЕРЕЛА',
    prev: 'Назад',
    torque: 'Момент затяжки',
    confidence: 'впевненість',
    expand: 'Збільшити',
    fallbackIllustration: 'Резервна ілюстрація',
    regenerate: 'Перегенерувати',
    retryIllustration: 'Повторити ілюстрацію',
    queuedStatus: 'В черзі…',
    searchingRefs: 'Пошук посилань…',
    analyzingRefs: 'Аналіз схеми…',
    generatingStatus: 'Генерація ілюстрації…',
    aiIllustration: 'ШІ ілюстрація',
    availableForRegistered: 'Доступно для зареєстрованих користувачів',
    createFreeAccount: 'Створити безкоштовний акаунт',
    createAccountToContinue: 'Створіть акаунт для продовження',
    upgradeDesc: 'Задавайте питання, зберігайте інструкції та відкрийте повний функціонал.',
    signIn: 'Увійти',
    askAiAboutStep: 'Запитати ШІ про цей крок',
    askAi: 'Запитати ШІ',
    askPlaceholder: 'напр. Який момент затяжки тут використовувати?',
    ask: 'Запитати',
    aiExplanationError: 'Не вдалося отримати пояснення ШІ.',
    errorLoadMsg: 'Цю інструкцію не вдалося завантажити. Вона могла бути видалена або тимчасово недоступна.',
    sourceBackedLabel: 'З джерела',
    webSynthesisLabel: 'Веб-синтез',
    aiGeneratedLabel: 'ШІ генерація',
  },

  profilePage: {
    title: 'Ваш профіль',
    sub: 'Керуйте інформацією акаунту та вподобаннями.',
    accountSection: 'Акаунт',
    firstName: 'Ім\'я',
    lastName: 'Прізвище',
    emailLabel: 'Електронна пошта',
    primaryVehicle: 'Основний транспорт',
    yourPlan: 'Ваш план',
    freePlan: '⚡ Безкоштовний план',
    proPlan: '⚡ Pro план — $39/міс',
    enterprisePlan: '🏢 Enterprise план',
    guidesThisMonth: 'Інструкції цього місяця',
    imageGeneration: 'Генерація зображень',
    upgradeToProPrice: 'Оновити до Pro — $39/міс →',
    unlimited: 'Безлімітно',
    priorityImage: 'Пріоритетно',
    mobileEnabled: 'Мобільний додаток: Увімкнено',
    apiEnabled: 'Доступ до API: Увімкнено',
    nextBilling: 'Наступне списання',
    manageSubscription: 'Керувати підпискою',
    teamMembers: 'Учасники команди: 4 / 10',
    manualsUploaded: 'Завантажено мануалів: 2',
    customSla: 'Спеціальний SLA: Увімкнено',
    accountManager: 'Менеджер акаунту',
    contactSupport: 'Зв\'язатися з підтримкою',
    preferences: 'Вподобання',
    country: 'Країна',
    preferredBrands: 'Бажані бренди',
    billingDetails: 'Деталі білінгу',
    currentPlan: 'Поточний план',
    nextBillingDate: 'Наступна дата списання',
    paymentMethod: 'Спосіб оплати',
    cardEndingIn: 'Картка, що закінчується на',
    noPaymentMethod: 'Спосіб оплати не додано',
    addPaymentMethod: 'Додати спосіб оплати',
    companyName: 'Назва компанії',
    billingEmail: 'Email для білінгу',
    vatTaxId: 'ПДВ / ІПН',
    billingAddress: 'Адреса для білінгу',
    billingHistory: 'Історія оплат',
    upgradeToPro: 'Оновити до Pro',
    saved: '✓ Збережено',
    saveProfile: 'Зберегти профіль',
    perMonth: '/міс',
    active: 'Активний',
    organization: 'Організація',
  },

  navAuth: {
    dashboard: 'Панель',
    profile: 'Профіль',
    settings: 'Налаштування',
    logOut: 'Вийти',
    logIn: 'Увійти',
    startTrial: 'Спробувати',
  },

  dashboard: {
    trialStartedNotice: 'Ваш 7-денний Pro-тріал активний! Насолоджуйтесь повним доступом.',
    proActivatedNotice: 'Pro-план активовано! Тепер у вас необмежений доступ.',
    billingCancelledNotice: 'Оплату скасовано. Ви можете почати тріал у будь-який час у Налаштуваннях.',
  },

  vehicleSelector: {
    brand: 'Бренд',
    model: 'Модель',
    year: 'Рік',
    selectBrand: 'Оберіть бренд…',
    selectModel: 'Оберіть модель…',
    selectYear: 'Оберіть рік…',
    loading: 'Завантаження…',
  },

  heroActions: {
    startForFree: 'Почати безкоштовно',
    viewDashboard: 'Перейти до панелі',
  },

  forgotPassword: {
    title: 'Забули пароль?',
    sub: 'Введіть вашу email і ми надішлемо токен скидання.',
    emailLabel: 'Електронна пошта',
    sendResetToken: 'Надіслати токен',
    sending: 'Надсилання…',
    tokenReady: 'Токен готовий',
    tokenReadySub: 'У виробничій версії це буде надіслано на email. Скопіюйте і використайте токен нижче.',
    tokenNote: 'Натисніть, щоб виділити все · дійсний 15 хвилин',
    continueToReset: 'Продовжити скидання паролю',
    backToSignIn: 'Повернутися до входу',
  },

  resetPassword: {
    title: 'Скидання паролю',
    backToSignIn: 'Повернутися до входу',
    resetTokenLabel: 'Токен скидання',
    pasteToken: 'Вставте ваш токен скидання тут',
    newPassword: 'Новий пароль',
    confirmNewPassword: 'Підтвердити новий пароль',
    updatePassword: 'Оновити пароль',
    updating: 'Оновлення…',
    passwordMinLength: 'Пароль має бути не менше 8 символів.',
    passwordsMismatch: 'Паролі не збігаються.',
    invalidToken: 'Недійсний або прострочений токен',
  },

  aboutPage: {
    heroEyebrow: 'Про Motixi',
    heroTitle: 'Створено для тих,\nхто справді ремонтує.',
    heroSub: 'Motixi — це ШІ-платформа, яка миттєво генерує структуровані інструкції з ремонту. Створена інженерами, які розуміють, як насправді працюють майстерні.',

    storyEyebrow: 'Наша історія',
    storyTitle: 'Чому ми створили Motixi',
    storyP1: 'Ми прийшли з корпоративного консалтингу та розробки програмного забезпечення — будували платформи для банків, рітейлу та технологічних компаній. Але коли ми подивились на автомобільну галузь і важку техніку, побачили індустрію, яка тоне в розрізнених PDF-ках, усних знаннях і застарілих мануалах. Техніки заслуговують на кращі інструменти.',
    storyP2: 'Тому ми створили Motixi: ШІ-двигун, який перетворює модель автомобіля та опис ремонту на повну покрокову інструкцію — з моментами затяжки, примітками безпеки та діаграмами — менш ніж за 3 секунди. Без пошуку в мануалах. Без здогадок. Просто правильна процедура, просто зараз.',

    leadershipEyebrow: 'Команда',
    leadershipTitle: 'Люди за Motixi',
    ceoName: 'Кирило Петров',
    ceoRole: 'Засновник та CEO',
    ceoIntro: 'Продуктовий підприємець, який будує AI-платформи для реальних індустрій.',
    ceoBullets: [
      '10+ років у корпоративному консалтингу та цифровій трансформації',
      'Створював платформи для великих організацій у фінансах та ритейлі',
      'Сильний фокус на продуктовій стратегії та реалізації',
      'Засновник Motixi — вирішує реальні проблеми в автомобільному ремонті',
    ],
    ctoName: 'Михайло',
    ctoRole: 'CTO та співзасновник',
    ctoIntro: 'Full-stack архітектор з 20+ роками досвіду в масштабованих системах та керуванні командами.',
    ctoBullets: [
      'Проєктував та запускав великомасштабні розподілені системи',
      'Глибока експертиза в бекенд-архітектурі та надійності систем',
      'Очолює інженерію в Motixi від інфраструктури до продукту',
      'Великий досвід у менеджменті та масштабуванні інженерних команд',
    ],
    linkedinLabel: 'LinkedIn',
    emailLabel: 'Email',

    whyEyebrow: 'Навіщо ми це робимо',
    whyTitle: 'Що нас рухає щодня',
    whyCards: [
      { icon: '⚡', title: 'Швидкість', desc: 'Інструкції за 3 секунди. Без очікування, без пошуку, без копання в PDF-ках.' },
      { icon: '🎯', title: 'Точність', desc: 'Перевірені ШІ процедури з моментами затяжки, попередженнями безпеки та номерами деталей — не загальні поради.' },
      { icon: '🛠️', title: 'Зручність', desc: 'Створено для реальних майстерень — мобільний формат, покроково, працює навіть з мастилом на руках.' },
      { icon: '🚫', title: 'Без зайвого', desc: 'Без підписок на 10 баз даних. Без застарілих мануалів. Один інструмент, який працює.' },
    ],

    expEyebrow: 'Досвід',
    expTitle: 'Що стоїть за нашою експертизою',
    expBullets: [
      { label: 'Корпоративні рішення', desc: 'Мультитенантні платформи для фінансів, рітейлу та технологій — від дослідження до продакшну.' },
      { label: 'ШІ та дані', desc: 'ШІ-продукти від раннього прототипу до масштабованих систем, які обслуговують реальних користувачів.' },
      { label: 'Автомобілі та автопарки', desc: 'Прямий досвід з операціями автопарків, робочими процесами ремонту та документаційною прогалиною.' },
      { label: 'Повний цикл продукту', desc: 'Стратегія, дорожня карта, структура команди, вихід на ринок — від ідеї до клієнтів, що платять.' },
      { label: 'Full-stack інженерія', desc: 'Продакшн-код, API, мобільні додатки, інфраструктура — без розриву між баченням та виконанням.' },
    ],

    ctaQuote: 'Найкраща інструкція з ремонту — та, що існує саме тоді, коли вона потрібна — точна, структурована і швидша за будь-який пошук у мануалі.',
    ctaQuoteAttr: '— Кирило Петров, Засновник та CEO',
    ctaTrial: 'Спробувати безкоштовно',
    ctaContact: 'Зв\'язатися з нами →',
  },

  productPage: {
    eyebrow: 'Продукт',
    title: 'ШІ інструкції з ремонту.\nМиттєво. Структуровано. Точно.',
    sub: 'Введіть модель транспорту та опис ремонту. Отримайте повну покрокову процедуру — з моментами затяжки, інструментами, попередженнями безпеки та інженерними схемами — менш ніж за 3 секунди.',
    startTrial: 'Почати пробний період',
    tryDemo: 'Спробувати демо',
    talkToFounder: 'Поговорити із засновником →',
    guestAuthFailed: 'Не вдалося відкрити демо-доступ. Спробуйте ще раз.',
    walkthroughEyebrow: 'Огляд продукту',
    walkthroughTitle: 'Від пошуку до інструкції за три кроки',
    walkthroughSub: 'Доступно на вебі та мобільному — той самий ШІ, та сама точність, будь-який пристрій.',
    step01: 'Крок 01',
    step01title: 'Введіть запит',
    step01desc: 'Природна мова або структурований формат — VIN, назва моделі, номер деталі. Без спеціального синтаксису.',
    step02: 'Крок 02',
    step02title: 'Миттєвий результат або генерація',
    step02desc: 'Motixi спочатку шукає в базі знань. Збіги миттєві — нові інструкції менш ніж за 3 секунди.',
    step03: 'Крок 03',
    step03title: 'Виконуйте крок за кроком',
    step03desc: 'Впорядковані кроки, моменти затяжки, інструменти, попередження. Діаграми відображаються під час роботи.',
    whoEyebrow: 'Для кого',
    whoTitle: 'Створено для тих, хто ремонтує',
    whoSub: 'Від одиночних майстрів до корпоративних автопарків.',
    forCards: [
      { icon: '🔧', label: 'Незалежні майстри', desc: 'Знайдіть правильну процедуру за секунди — без пошуку PDF, без здогадок на форумах, без невідповідних характеристик.' },
      { icon: '🏭', label: 'Автомайстерні', desc: 'Стандартизуйте процедури ремонту для вашої команди з послідовними, ШІ-генерованими кроками.' },
      { icon: '🚛', label: 'Оператори важкої техніки', desc: 'Інструкції для екскаваторів, кранів та спеціальної техніки — не тільки легкових авто.' },
      { icon: '📋', label: 'Сервісні менеджери', desc: 'Скоротіть час діагностики та зменшіть витрати на навчання з довідковими інструкціями на вимогу.' },
    ],
    guideOutputEyebrow: 'Результат інструкції',
    guideOutputTitle: 'Все, що потрібно технік, структуровано',
    guideOutputSub: 'Кожна згенерована інструкція включає ці елементи — не скорочені резюме.',
    guideOutputs: [
      'Впорядкована послідовність кроків', 'Моменти затяжки', 'Список необхідних інструментів',
      'Посилання на OEM деталі', 'Попередження безпеки', 'Інженерні схеми',
      'Рівень складності', 'Час виконання',
    ],
    whyEyebrow: 'Чому Motixi',
    whyTitle: 'Не чат-бот. Не мануал.\nДещо краще.',
    differentiators: [
      { vs: 'проти PDF мануалів', title: 'Пошуковий. Миттєвий. Структурований.', desc: 'Без завантаження. Без гортання 400 сторінок. Природна мова на вході, структурована процедура на виході.' },
      { vs: 'проти тем на форумах', title: 'Авторитетний, не анекдотичний', desc: 'Побудований на знаннях ШІ — не на думках з форумів, які можуть не відповідати вашій точній комплектації.' },
      { vs: 'проти загального ШІ чату', title: 'Доменно-орієнтований результат', desc: 'Motixi створений для автомобільного ремонту. Він розуміє моменти затяжки, посилання OEM та вимоги до інструментів.' },
    ],
    ctaEyebrow: 'Почніть сьогодні',
    ctaTitle: 'Згенеруйте першу інструкцію безкоштовно.',
    ctaSub: 'Без кредитної картки. Без налаштування. Тільки результати.',
    alreadyHaveAccount: 'Вже є акаунт →',
  },

  contactPage: {
    eyebrow: 'Контакти',
    title: 'Давайте поговоримо',
    sub: 'Для партнерств, корпоративних впроваджень, консалтингу, продуктової стратегії або будь-яких питань про Motixi — я відповідаю особисто.',
    founderName: 'Кирило Петров',
    founderRole: 'Засновник та CEO, Motixi',
    email: 'Email',
    linkedin: 'LinkedIn',
    getInTouchTitle: 'Зв\'яжіться напряму',
    getInTouchP1: 'Я відповідаю особисто на кожне повідомлення. Чи оцінюєте ви Motixi для вашої майстерні, досліджуєте корпоративне впровадження, шукаєте консалтингову розмову, чи просто хочете обговорити проблемний простір — я на зв\'язку.',
    getInTouchP2: 'Найшвидший шлях — email. LinkedIn також працює для більш формального знайомства.',
    responseNote: 'Зазвичай відповідає протягом 24 годин.',
  },

  newGuide: {
    backToGuides: 'До інструкцій',
  },

  countrySelector: {
    title: 'Оберіть регіон',
    sub: 'Це встановить мову додатку. Ви зможете змінити її пізніше в налаштуваннях.',
    confirm: 'Продовжити',
  },

  footer: {
    product: 'Продукт',
    about: 'Про нас',
    contact: 'Контакти',
    email: 'Пошта',
  },

  time: {
    justNow: 'щойно',
    minutesAgo: 'хв тому',
    hoursAgo: 'год тому',
    yesterday: 'вчора',
    daysAgo: 'дн тому',
  },
};

// ── Bulgarian ────────────────────────────────────────────────────────────────

const bg: Translations = {
  common: {
    appName: 'Motixi',
    search: 'Търсене',
    back: 'Назад',
    continue_: 'Продължи',
    save: 'Запази',
    cancel: 'Отказ',
    delete_: 'Изтрий',
    edit: 'Редактирай',
    retry: 'Опитай отново',
    loading: 'Зареждане…',
    or: 'или',
    all: 'Всички',
    optional: 'по избор',
    required: '*',
    email: 'Имейл',
    password: 'Парола',
    logOut: 'Излез',
    logIn: 'Влез',
    signIn: 'Вход',
    signUp: 'Регистрация',
    guides: 'Ръководства',
    steps: 'стъпки',
    vehicle: 'Превозно средство',
    vehicles: 'Превозни средства',
    settings: 'Настройки',
    profile: 'Профил',
    dashboard: 'Табло',
    copyrightNotice: '© 2026 Motixi. Всички права запазени.',
    product: 'Продукт',
    about: 'За нас',
    contacts: 'Контакти',
  },

  nav: {
    howItWorks: 'Как работи',
    features: 'Функции',
    pricing: 'Цени',
    startTrial: 'Пробен период',
    openNavigation: 'Отвори менюто',
    closeNavigation: 'Затвори менюто',
  },

  landing: {
    heroEyebrow: 'ИИ Ремонтен Интелект',
    heroTitle: 'Базата знания за ремонт',
    heroTitleGrad: 'за всяко превозно средство.',
    heroSub: 'Задайте всякакъв ремонтен въпрос. Motixi търси в базата знания — ако ръководството съществува, получавате го моментално. Ако не — ИИ го генерира и го запазва за всички.',
    searchPlaceholder: 'Търсене по превозно средство, проблем или компонент…',
    tryLabel: 'Опитайте:',
    recentLabel: 'Скорошни:',
    popularRepairs: 'Популярни ремонти',
    guidesCount: 'ръководства',
    trustedBy: 'Доверен от екипите на',
    howEyebrow: 'Как работи',
    howTitle: 'От запитване до ръководство в четири стъпки',
    step01title: 'Търсене или въпрос',
    step01text: 'Въведете модел на превозно средство и описание на ремонт — или попитайте естествено, например "bmw e90 смяна на масло".',
    step02title: 'ИИ търси в базата знания',
    step02text: 'Motixi проверява хиляди запазени ръководства преди да генерира нещо ново.',
    step03title: 'Моментален резултат или ново ръководство',
    step03text: 'Получете съществуващо ръководство за по-малко от секунда, или ИИ генерира ново за 3 секунди.',
    step04title: 'Следвайте стъпка по стъпка',
    step04text: 'Отворете ръководството в уеб или мобилен и следвайте заедно с инженерни диаграми.',
    statGeneration: 'Генериране на ръководство',
    statSteps: 'Стъпки в ръководство',
    statAiGenerated: 'Генерирано от ИИ',
    statVehicleModels: 'Модели превозни средства',
    featuresEyebrow: 'Функции',
    featuresTitle: 'Всичко, от което техникът се нуждае',
    featuresSub: 'Създадено за скорост, точност и реални работилнични условия.',
    feat1title: 'Моментално генериране',
    feat1desc: 'VIN или модел + номер на част → пълно структурирано ръководство за 3 секунди.',
    feat2title: 'Прецизност стъпка по стъпка',
    feat2desc: '8–15 подредени стъпки с моменти на затягане, необходими инструменти и предупреждения за безопасност.',
    feat3title: 'Инженерни диаграми',
    feat3desc: 'ИИ-генерирани технически диаграми за всяка стъпка.',
    feat4title: 'Уеб и мобилен',
    feat4desc: 'Единен бекенд захранва уеб таблото и мобилното Flutter приложение.',
    feat5title: 'Фонова опашка за задачи',
    feat5desc: 'Генерирането на изображения работи асинхронно с проследяване на статуса в реално време.',
    feat6title: 'Готово за предприятия',
    feat6desc: 'Изолация на наемател, зареждане на ръководства, контрол на достъпа и администраторски панел.',
    mobileEyebrow: 'Мобилно приложение',
    mobileTitle: 'Ремонтни ръководства\nв джоба ви',
    mobileSub: 'Същите ИИ-генерирани ремонтни ръководства, оптимизирани за мобилен. Преминавайте през стъпките, увеличавайте диаграмите, проследявайте напредъка — работи офлайн.',
    mobileBullet1: 'Плъзгайте стъпките с една ръка',
    mobileBullet2: 'Увеличавайте инженерни диаграми',
    mobileBullet3: 'Офлайн режим за работилница',
    mobileEarlyAccess: 'Заявете ранен достъп',
    mobileComingSoon: 'Скоро за iOS и Android',
    phoneMyWorkspace: 'Моето работно пространство',
    phoneGuides: 'Ръководства',
    phoneGuidesCount: '3 ръководства · тази седмица',
    phoneSearchGuides: 'Търсене на ръководства…',
    phoneRecent: 'Скорошни',
    phoneGarage: 'Гараж',
    phoneProfile: 'Профил',
    phoneBack: 'Назад',
    phoneToolsRequired: 'Необходими инструменти',
    phoneSafetyNotes: 'Бележки за безопасност',
    phoneSafetyLine1: 'Изолирайте акумулатора и хидравличното налягане преди разглобяване.',
    phoneSafetyLine2: 'Използвайте стойки и клинове на равна повърхност.',
    phoneStepOf: 'СТЪПКА 1 ОТ 10',
    phoneOfSteps: 'от 10 стъпки',
    pricingEyebrow: 'Цени',
    pricingTitle: 'Прости и прозрачни цени',
    pricingSub: 'Започнете безплатно. Надградете, когато ви трябва повече.',
    planFreeName: 'Безплатен',
    planFreeDesc: 'Започнете без разходи.',
    planFreeItem1: '5 ръководства / месец',
    planFreeItem2: 'Стандартен изход',
    planFreeItem3: 'Уеб достъп',
    planFreeItem4: 'Поддръжка от общността',
    planFreeGetStarted: 'Започнете',
    planProName: 'Pro',
    planProDesc: 'За работещи техници.',
    planProItem1: 'Неограничени ръководства',
    planProItem2: 'Приоритетни изображения',
    planProItem3: 'Уеб + мобилен',
    planProItem4: 'Достъп до API',
    planProItem5: 'Имейл поддръжка',
    planProStartTrial: 'Пробен период',
    planProMostPopular: 'Най-популярен',
    planEntName: 'Enterprise',
    planEntDesc: 'За автопаркове и работилници.',
    planEntItem1: 'Изолация на наемател',
    planEntItem2: 'Зареждане на ръководства',
    planEntItem3: 'Администраторско табло',
    planEntItem4: 'Гаранция SLA',
    planEntItem5: 'Специална поддръжка',
    planEntContactUs: 'Свържете се с нас',
    planPerMonth: '/мес',
    planCustom: 'По заявка',
    ctaEyebrow: 'Започнете днес',
    ctaTitle: 'Генерирайте първото си ремонтно ръководство безплатно.',
    ctaSub: 'Без кредитна карта. Без настройка. Само резултати.',
    ctaStartTrial: 'Пробен период',
    ctaAlreadyHaveAccount: 'Вече имате акаунт →',
    demoSourceLabel: 'Сервизно ръководство Haynes',
    demoOemVerified: 'OEM проверено',
    demoVehicle1: 'BMW E90 330d',
    demoTitle1: 'Спирачен апарат — напречен разрез',
    demoViewBadge: 'Инженерен изглед',
    demoTime1: '45 мин',
    demoTools1: '8 инструмента',
    demoSteps1: '10 стъпки',
    demoSafety1: '3 бележки за безопасност',
    demoProcTitle: 'Смяна на спирачни накладки',
    demoProcStep: '3 / 10',
    demoProcVehicle: 'Nissan Qashqai J10 · 2019',
    demoStep1: 'Свалете колелото и капачката',
    demoStep2: 'Разхлабете водещите болтове на апарата',
    demoStep3: 'Натиснете буталото на апарата',
    demoStep4: 'Поставете нови накладки',
    demoStep5: 'Затегнете болтовете · 35 Нм',
    demoAiOrganized: '✦ AI организирано',
    demoTime2: '90–120 мин',
    demoTorqueTag: 'Момент: 35 Нм',
    demoVerifiedTag: 'Проверено по ръководство',
  },

  authModal: {
    title: 'Влезте, за да търсите',
    sub: 'Създайте безплатен акаунт за генериране на ръководства или опитайте 3 демо ръководства като гост.',
    createAccount: 'Създай акаунт',
    signIn: 'Вход',
    continueAsGuest: 'Продължи като гост',
    guestLoadingText: 'Зареждане…',
    guestNote: 'Гостите виждат 3 реални ръководства в режим само за четене.',
  },

  auth: {
    welcomeBack: 'Добре дошли отново',
    noAccount: 'Нямате акаунт?',
    createOneFree: 'Създайте безплатно',
    forgotPassword: 'Забравена парола?',
    signingIn: 'Влизане…',
    createAccount: 'Създай акаунт',
    alreadyHaveAccount: 'Вече имате акаунт?',
    passwordMinLength: 'минимум 8 символа',
    creatingAccount: 'Създаване на акаунт…',
    continueAsGuest: 'Продължи като гост',
    loginFailed: 'Неуспешен вход',
    signupFailed: 'Неуспешна регистрация',
    guestFailed: 'Неуспешно продължаване като гост',
  },

  onboarding: {
    welcomeHeading: 'Добре дошли в Motixi',
    welcomeSub: 'ИИ-генерирани ремонтни ръководства, които познават вашето превозно средство, частите и задачите — всичко на едно място.',
    featuresHeading: 'Всичко необходимо за правилен ремонт',
    featuresSub: 'От смяна на масло до ангренажен ремък — Motixi генерира прецизни стъпкови ръководства с ИИ илюстрации.',
    feat1title: 'Стъпка по стъпка ръководства',
    feat1desc: 'Автоматично генерирани от OEM данни и доверени източници',
    feat2title: 'ИИ илюстрации',
    feat2desc: 'Визуална справка за всяка ремонтна стъпка',
    feat3title: 'Питайте ръководството',
    feat3desc: 'Получете моментални отговори на ремонтни въпроси',
    choosePlanHeading: 'Изберете план',
    choosePlanSub: 'Опитайте Pro безплатно за 7 дни или започнете с безплатния план.',
    planTrialName: '7-дневен безплатен пробен период',
    planTrialDesc: 'Пълен достъп — ИИ илюстрации, OEM-базирани ръководства, неограничени ремонти.',
    planTrialBadge: 'Препоръчано',
    planTrialNote: 'Необходима е карта. Без таксуване днес — отменете по всяко време преди края на пробния период. Подновяване за $39/мес.',
    planPremiumName: 'Премиум',
    planPremiumDesc: 'Пълен достъп веднага. Най-доброто за сервизи и сериозни техници.',
    planFreeName: 'Безплатен (ограничен)',
    planFreeDesc: 'Базово генериране на ръководства. Без ИИ илюстрации, ограничена история.',
    startMyFreeTrial: 'Започни пробен период',
    getPremiumAccess: 'Вземи Премиум достъп',
    continueFree: 'Продължи безплатно',
    settingUp: 'Настройване…',
    skipToPlanSelection: 'Към избор на план',
    somethingWentWrong: 'Нещо се обърка. Моля, опитайте отново.',
  },

  dash: {
    sampleGuides: 'Демо ръководства',
    guidesTitle: 'Ръководства',
    guidesSub: 'Вашите ИИ-генерирани ремонтни ръководства',
    sampleGuidesSub: '3 реални ръководства от Motixi — режим само за четене',
    newGuide: 'Ново ръководство',
    guestBanner: 'Вие сте в демо режим — това са реални ръководства.',
    guestBannerLink: 'Създайте безплатен акаунт',
    guestBannerSuffix: 'за да генерирате свои.',
    thisMonth: 'Този месец',
    timeSaved: 'Спестено време',
    topRepair: 'Топ ремонт',
    searchGuides: 'Търсене на ръководства…',
    filterSampleGuides: 'Филтриране на демо ръководства…',
    allDifficulties: 'Всички нива',
    beginner: 'Начинаещ',
    intermediate: 'Среден',
    advanced: 'Напреднал',
    expert: 'Експерт',
    mostRecent: 'Най-скорошни',
    aToZ: 'А → Я',
    loadingGuides: 'Зареждане на ръководства…',
    noSampleMatch: 'Няма демо ръководства, съответстващи на филтъра',
    noSampleMatchSub: 'Опитайте друга ключова дума или изчистете филтъра.',
    clearFilter: 'Изчисти филтъра',
    noResultsFor: 'Няма резултати за',
    noResultsSub: 'Опитайте друг термин за търсене.',
    couldNotLoadGuides: 'Не можаха да се заредят ръководствата',
    noGuidesYet: 'Все още няма ръководства',
    noGuidesYetSub: 'Натиснете Ново ръководство, за да генерирате първото ИИ ремонтно ръководство.',
    deleteGuide: 'Изтрий ръководството',
    imagesGenerating: 'Изображенията се генерират',
    imagesFailed: 'Неуспешно генериране на изображения',
    ready: 'Готово',
  },

  garage: {
    title: 'Превозни средства',
    sub: 'Превозни средства от историята на ремонтите ви',
    noVehiclesYet: 'Все още няма превозни средства',
    noVehiclesSub: 'Генерирайте ръководство, за да добавите превозно средство.',
    guideCount: 'ръководство',
    guidesCount: 'ръководства',
  },

  jobs: {
    title: 'Задачи',
    sub: 'Проследявайте активни ремонтни задачи',
    logRepairJob: 'Запишете ремонтна задача',
    problemDescription: 'Описание на проблема',
    notes: 'Бележки',
    additionalContext: 'Допълнителен контекст',
    selectVehicle: 'Изберете превозно средство…',
    createJob: 'Създай задача',
    creating: 'Създаване…',
    noJobsYet: 'Все още няма ремонтни задачи',
    noJobsSub: 'Запишете първата задача по-горе.',
    pending: 'Изчакващ',
    inProgress: 'В процес',
    completed: 'Завършен',
    start: 'Започни',
    complete: 'Завърши',
    guideLabel: 'Ръководство:',
  },

  requests: {
    title: 'Заявки',
    sub: 'Заявете ръководства за вашия автопарк',
    requestAGuide: 'Заяви ръководство',
    vehicleModel: 'Модел на превозно средство',
    repairType: 'Тип ремонт',
    partNumber: 'Номер на част',
    notes: 'Бележки',
    additionalContext: 'Допълнителен контекст',
    submitRequest: 'Изпрати заявка',
    submitting: 'Изпращане…',
    noRequestsYet: 'Все още няма заявки',
    noRequestsSub: 'Изпратете заявка за ръководство по-горе.',
    guideReady: 'Ръководството е готово:',
  },

  manuals: {
    title: 'Библиотека с ръководства',
    sub: 'Качете OEM ръководства и генерирайте инструкции от вашата документация',
    uploadManual: 'Качи ръководство',
    titleField: 'Заглавие',
    pdfUrl: 'PDF URL',
    vehicleModel: 'Модел на превозно средство',
    extractedText: 'Извлечен текст',
    saveManual: 'Запази ръководството',
    saving: 'Запазване…',
    generateFromManual: 'Генерирай от ръководство',
    selectManual: 'Изберете ръководство…',
    partName: 'Име на част',
    oemNumber: 'OEM номер',
    generateGuide: 'Генерирай ръководство',
    generating: 'Генериране…',
    guideReady: 'Ръководството е готово:',
    uploadedManuals: 'Качени ръководства',
    noManualsUploaded: 'Няма качени ръководства',
    noManualsSub: 'Качете PDF ръководство по-горе, за да започнете.',
    manual: 'Ръководство',
  },

  settingsView: {
    title: 'Настройки',
    sub: 'Акаунт и плащане',
    account: 'Акаунт',
    emailLabel: 'Имейл',
    planLabel: 'План',
    trialEndsIn: 'Пробният период приключва след',
    day: 'ден',
    days: 'дни',
    planAndUsage: 'План и употреба',
    planPro: 'План — Pro',
    proActive: 'Pro план активен',
    proActiveDesc: 'Неограничени ръководства · Приоритетно генериране на изображения · Достъп до API',
    trialActive: 'Pro пробен период активен',
    trialRenewsAs: 'Подновява се като Pro ($39/мес) след пробния период, освен ако не бъде отменен.',
    manageSubscription: 'Управление на абонамента',
    startTrialCta: '7 дни безплатно — след това $39/мес',
    guidesThisMonth: 'Ръководства този месец',
    havePromoCode: 'Имате промо код?',
    enterCode: 'Въведете код…',
    apply: 'Приложи',
    promoApplied: '🎉 Промо кодът е приложен! Вече имате Pro достъп.',
    invalidPromoCode: 'Невалиден промо код',
  },

  sidebar: {
    sampleGuides: 'Демо ръководства',
    createFreeAccount: 'Създай акаунт',
    newGuide: 'Ново ръководство',
    workshop: 'РАБОТИЛНИЦА',
    jobs: 'Задачи',
    requests: 'Заявки',
    analytics: 'Аналитика',
    account: 'АКАУНТ',
    settings: 'Настройки',
    exitDemo: 'Излез от демо',
    logOut: 'Излез',
    enterprise: 'Enterprise',
    pro: 'Pro ✓',
    trial: 'Pro Trial',
    free: 'Безплатен',
    limitReached: 'лимитът е достигнат',
    upgrade: 'надградете',
  },

  guideForm: {
    aiGenerated: 'ИИ Генериране',
    sourceBacked: 'От източник',
    step1title: 'Стъпка 1 от 3 — Изберете превозно средство',
    manualEntry: 'Ръчно въвеждане',
    vinDecode: 'VIN декодиране',
    vinOptional: 'VIN',
    vinNumber: 'VIN номер',
    decode: 'Декодирай',
    vinError11: 'Въведете поне 11 символа',
    couldNotDecodeVin: 'Не може да се декодира VIN — проверете номера и опитайте отново',
    networkError: 'Мрежова грешка — проверете връзката си',
    step2title: 'Стъпка 2 от 3 — Какво трябва да се ремонтира?',
    partRepairDesc: 'Част / описание на ремонт',
    partPlaceholder: 'напр. Хидравлична помпа, спирачки, смяна на масло…',
    didYouMean: 'Имахте предвид:',
    oemPartNumber: 'OEM / номер на част',
    review: 'Преглед',
    step3title: 'Стъпка 3 от 3 — Потвърди и генерирай',
    vehicleLabel: 'Превозно средство',
    vinLabel: 'VIN',
    repairLabel: 'Ремонт',
    partNoLabel: 'Номер на част',
    generateGuide: 'Генерирай ръководство',
    generatingGuide: 'Генериране…',
    sourceTitle: 'Ръководство от източник',
    sourceBadge: 'Nissan и Toyota',
    sourceDesc: 'Ръководствата са синтезирани от верифицирани данни на сервизни ръководства NICOclub и ToyoDIY.',
    make: 'Марка',
    model: 'Модел',
    year: 'Година',
    task: 'Задача',
    selectModel: 'Изберете модел…',
    selectYear: 'Изберете година…',
    selectTask: 'Изберете задача…',
    source: 'Източник:',
    sourceNissan: 'Сервизно ръководство NICOclub',
    sourceToyota: 'Компонентен справочник ToyoDIY',
    generateFromSource: 'Генерирай от източник',
    synthesisingFromSource: 'Синтезиране от източник…',
    taskOilChange: 'Смяна на моторно масло и филтър',
    taskBrakePad: 'Смяна на спирачни накладки',
    taskBrakeFluid: 'Промиване на спирачна течност',
    continue: 'Продължи',
    back: 'Назад',
    edit: 'Редактирай',
  },

  guideDetail: {
    backToGuides: 'Към ръководствата',
    overview: 'Преглед',
    difficulty: 'Трудност',
    timeEstimate: 'Приблизително време',
    stepsLabel: 'Стъпки',
    toolsRequired: 'Необходими инструменти',
    safetyWarnings: 'Предупреждения за безопасност',
    step: 'Стъпка',
    stepOf: 'от',
    previous: 'Назад',
    next: 'Напред',
    done: 'Готово',
    preparingIllustration: 'Подготовка на илюстрация…',
    generatingImage: 'Генериране на изображение…',
    imageReady: 'Изображението е готово',
    imageFailed: 'Неуспешно генериране на изображение',
    generateImage: 'Генерирай изображение',
    noImageAvailable: 'Няма налично изображение',
    procedure: 'ПРОЦЕДУРА',
    moreTools: 'още',
    showLess: 'Покажи по-малко',
    safetyNotes: 'Бележки за безопасност',
    nSafetyNotes: 'бележки за безопасност',
    sourceReferences: 'ИЗТОЧНИЦИ',
    prev: 'Назад',
    torque: 'Въртящ момент',
    confidence: 'увереност',
    expand: 'Увеличи',
    fallbackIllustration: 'Резервна илюстрация',
    regenerate: 'Регенерирай',
    retryIllustration: 'Повтори илюстрацията',
    queuedStatus: 'На опашка…',
    searchingRefs: 'Търсене на референции…',
    analyzingRefs: 'Анализ на диаграмата…',
    generatingStatus: 'Генериране на илюстрация…',
    aiIllustration: 'ИИ илюстрация',
    availableForRegistered: 'Достъпно за регистрирани потребители',
    createFreeAccount: 'Създай безплатен акаунт',
    createAccountToContinue: 'Създайте акаунт за да продължите',
    upgradeDesc: 'Задавайте въпроси, запазвайте ръководства и отключете пълната функционалност.',
    signIn: 'Вход',
    askAiAboutStep: 'Попитай ИИ за тази стъпка',
    askAi: 'Попитай ИИ',
    askPlaceholder: 'напр. Какъв въртящ момент да използвам тук?',
    ask: 'Попитай',
    aiExplanationError: 'Не може да се получи ИИ обяснение в момента.',
    errorLoadMsg: 'Това ръководство не може да бъде заредено. Може да е изтрито или временно недостъпно.',
    sourceBackedLabel: 'От източник',
    webSynthesisLabel: 'Уеб синтез',
    aiGeneratedLabel: 'ИИ генерирано',
  },

  profilePage: {
    title: 'Вашият профил',
    sub: 'Управлявайте информацията за акаунта и предпочитанията.',
    accountSection: 'Акаунт',
    firstName: 'Име',
    lastName: 'Фамилия',
    emailLabel: 'Имейл',
    primaryVehicle: 'Основно превозно средство',
    yourPlan: 'Вашият план',
    freePlan: '⚡ Безплатен план',
    proPlan: '⚡ Pro план — $39/мес',
    enterprisePlan: '🏢 Enterprise план',
    guidesThisMonth: 'Ръководства този месец',
    imageGeneration: 'Генериране на изображения',
    upgradeToProPrice: 'Надградете до Pro — $39/мес →',
    unlimited: 'Неограничен',
    priorityImage: 'Приоритетно',
    mobileEnabled: 'Мобилно приложение: Активирано',
    apiEnabled: 'Достъп до API: Активирано',
    nextBilling: 'Следващо плащане',
    manageSubscription: 'Управлявай абонамента',
    teamMembers: 'Членове на екипа: 4 / 10',
    manualsUploaded: 'Качени ръководства: 2',
    customSla: 'Потребителско SLA: Активирано',
    accountManager: 'Мениджър на акаунта',
    contactSupport: 'Свържете се с поддръжката',
    preferences: 'Предпочитания',
    country: 'Държава',
    preferredBrands: 'Предпочитани марки',
    billingDetails: 'Детайли за плащане',
    currentPlan: 'Текущ план',
    nextBillingDate: 'Следваща дата на плащане',
    paymentMethod: 'Метод на плащане',
    cardEndingIn: 'Карта, завършваща на',
    noPaymentMethod: 'Не е добавен метод на плащане',
    addPaymentMethod: 'Добави метод на плащане',
    companyName: 'Име на фирма',
    billingEmail: 'Имейл за фактуриране',
    vatTaxId: 'ДДС / Данъчен номер',
    billingAddress: 'Адрес за фактуриране',
    billingHistory: 'История на плащанията',
    upgradeToPro: 'Надградете до Pro',
    saved: '✓ Запазено',
    saveProfile: 'Запази профила',
    perMonth: '/мес',
    active: 'Активен',
    organization: 'Организация',
  },

  navAuth: {
    dashboard: 'Табло',
    profile: 'Профил',
    settings: 'Настройки',
    logOut: 'Излез',
    logIn: 'Влез',
    startTrial: 'Пробен период',
  },

  dashboard: {
    trialStartedNotice: 'Вашият 7-дневен Pro пробен период е активен! Наслаждавайте се на пълен достъп.',
    proActivatedNotice: 'Pro планът е активиран! Вече имате неограничен достъп.',
    billingCancelledNotice: 'Плащането беше отменено. Можете да започнете пробния период по всяко време от Настройки.',
  },

  vehicleSelector: {
    brand: 'Марка',
    model: 'Модел',
    year: 'Година',
    selectBrand: 'Изберете марка…',
    selectModel: 'Изберете модел…',
    selectYear: 'Изберете година…',
    loading: 'Зареждане…',
  },

  heroActions: {
    startForFree: 'Започнете безплатно',
    viewDashboard: 'Към таблото',
  },

  forgotPassword: {
    title: 'Забравена парола?',
    sub: 'Въведете имейла си и ще изпратим токен за нулиране.',
    emailLabel: 'Имейл',
    sendResetToken: 'Изпрати токен',
    sending: 'Изпращане…',
    tokenReady: 'Токенът е готов',
    tokenReadySub: 'В продукция това ще бъде изпратено по имейл. Копирайте и използвайте токена по-долу.',
    tokenNote: 'Натиснете, за да изберете всичко · валиден 15 минути',
    continueToReset: 'Продължи с нулиране на паролата',
    backToSignIn: 'Обратно към входа',
  },

  resetPassword: {
    title: 'Нулиране на парола',
    backToSignIn: 'Обратно към входа',
    resetTokenLabel: 'Токен за нулиране',
    pasteToken: 'Поставете вашия токен тук',
    newPassword: 'Нова парола',
    confirmNewPassword: 'Потвърдете новата парола',
    updatePassword: 'Обнови паролата',
    updating: 'Обновяване…',
    passwordMinLength: 'Паролата трябва да е поне 8 символа.',
    passwordsMismatch: 'Паролите не съвпадат.',
    invalidToken: 'Невалиден или изтекъл токен',
  },

  aboutPage: {
    heroEyebrow: 'За Motixi',
    heroTitle: 'Създадено за хората,\nкоито наистина ремонтират.',
    heroSub: 'Motixi е платформа с изкуствен интелект, която мигновено генерира структурирани ръководства за ремонт — създадена от инженери, които разбират как реално работят сервизите.',

    storyEyebrow: 'Нашата история',
    storyTitle: 'Защо създадохме Motixi',
    storyP1: 'Идваме от корпоративен консултинг и софтуерно инженерство — изграждахме платформи за банки, ритейл и технологични компании. Но когато погледнахме към автомобилната индустрия и тежката техника, видяхме сектор, затрупан с разпръснати PDF файлове, устни знания и остарели наръчници. Техниците заслужават по-добри инструменти.',
    storyP2: 'Затова създадохме Motixi: ИИ двигател, който превръща модел на автомобил и описание на ремонта в пълно ръководство стъпка по стъпка — с моменти на затягане, бележки за безопасност и диаграми — за по-малко от 3 секунди. Без ръчно търсене. Без догадки. Просто правилната процедура, точно сега.',

    leadershipEyebrow: 'Екип',
    leadershipTitle: 'Хората зад Motixi',
    ceoName: 'Кирило Петров',
    ceoRole: 'Основател и CEO',
    ceoIntro: 'Продуктов предприемач, изграждащ AI платформи за реални индустрии.',
    ceoBullets: [
      '10+ години в корпоративен консултинг и дигитална трансформация',
      'Изграждал платформи за големи организации във финанси и ритейл',
      'Силен фокус върху продуктова стратегия и изпълнение',
      'Основател на Motixi — решава реални проблеми в автомобилния ремонт',
    ],
    ctoName: 'Михайло',
    ctoRole: 'CTO и съосновател',
    ctoIntro: 'Full-stack архитект с 20+ години опит в мащабируеми системи и ръководене на екипи.',
    ctoBullets: [
      'Проектирал и доставял мащабни разпределени системи',
      'Дълбока експертиза в бекенд архитектура и надеждност на системи',
      'Ръководи инженерията в Motixi от инфраструктура до продукт',
      'Богат опит в управление и мащабиране на инженерни екипи',
    ],
    linkedinLabel: 'LinkedIn',
    emailLabel: 'Email',

    whyEyebrow: 'Защо го правим',
    whyTitle: 'Какво ни движи всеки ден',
    whyCards: [
      { icon: '⚡', title: 'Скорост', desc: 'Ръководства за 3 секунди. Без чакане, без търсене, без ровене в PDF файлове.' },
      { icon: '🎯', title: 'Точност', desc: 'Верифицирани от ИИ процедури с моменти на затягане, предупреждения за безопасност и номера на части — не общи съвети.' },
      { icon: '🛠️', title: 'Удобство', desc: 'Проектирано за реални сервизи — мобилен формат, стъпка по стъпка, работи дори с грес по ръцете.' },
      { icon: '🚫', title: 'Без излишно', desc: 'Без абонаменти за 10 бази данни. Без остарели наръчници. Един инструмент, който работи.' },
    ],

    expEyebrow: 'Опит',
    expTitle: 'Какво стои зад нашата експертиза',
    expBullets: [
      { label: 'Корпоративни решения', desc: 'Мултитенант платформи за финанси, ритейл и технологии — от проучване до продукция.' },
      { label: 'ИИ и данни', desc: 'ИИ продукти от ранен прототип до мащабирани системи, обслужващи реални потребители.' },
      { label: 'Автомобили и автопаркове', desc: 'Пряк опит с операции на автопаркове, ремонтни процеси и документационната празнина.' },
      { label: 'Пълен продуктов цикъл', desc: 'Стратегия, пътна карта, структура на екипа, излизане на пазара — от идея до плащащи клиенти.' },
      { label: 'Full-stack инженерство', desc: 'Продукционен код, API дизайн, мобилни приложения, инфраструктура — без пропуск между визия и изпълнение.' },
    ],

    ctaQuote: 'Най-доброто ръководство за ремонт е това, което съществува точно когато ви е нужно — точно, структурирано и по-бързо от всяко ръчно търсене.',
    ctaQuoteAttr: '— Кирило Петров, Основател и CEO',
    ctaTrial: 'Безплатен пробен период',
    ctaContact: 'Свържете се с нас →',
  },

  productPage: {
    eyebrow: 'Продукт',
    title: 'ИИ ръководства за ремонт.\nМигновено. Структурирано. Точно.',
    sub: 'Въведете модел на превозно средство и описание на ремонта. Получете пълна стъпка по стъпка процедура — с моменти на затягане, инструменти, предупреждения за безопасност и инженерни диаграми — за по-малко от 3 секунди.',
    startTrial: 'Пробен период',
    tryDemo: 'Пробвай демо',
    talkToFounder: 'Говорете с основателя →',
    guestAuthFailed: 'Демо достъпът не можа да бъде отворен. Моля, опитайте отново.',
    walkthroughEyebrow: 'Преглед на продукта',
    walkthroughTitle: 'От търсене до ръководство в три стъпки',
    walkthroughSub: 'Достъпно на уеб и мобилно — същият ИИ, същата точност, всяко устройство.',
    step01: 'Стъпка 01',
    step01title: 'Въведете заявка',
    step01desc: 'Естествен език или структуриран формат — VIN, име на модел, номер на част. Без специален синтаксис.',
    step02: 'Стъпка 02',
    step02title: 'Мигновен резултат или генериране',
    step02desc: 'Motixi първо търси в базата знания. Съвпаденията са мигновени — нови ръководства за по-малко от 3 секунди.',
    step03: 'Стъпка 03',
    step03title: 'Следвайте стъпка по стъпка',
    step03desc: 'Подредени стъпки, моменти на затягане, инструменти, предупреждения. Диаграмите се показват докато работите.',
    whoEyebrow: 'За кого е',
    whoTitle: 'Създадено за хора, които поправят неща',
    whoSub: 'От самостоятелни техници до корпоративни автосервизи.',
    forCards: [
      { icon: '🔧', label: 'Независими техници', desc: 'Намерете правилната процедура за секунди — без търсене на PDF, без гадаене във форуми, без несъответстващи спецификации.' },
      { icon: '🏭', label: 'Автосервизи', desc: 'Стандартизирайте процедурите за ремонт за вашия екип с последователни, ИИ-генерирани стъпки.' },
      { icon: '🚛', label: 'Оператори на тежка техника', desc: 'Ръководства за багери, кранове и специализирана техника — не само леки автомобили.' },
      { icon: '📋', label: 'Сервизни мениджъри', desc: 'Намалете времето за диагностика и разходите за обучение с референтни ръководства при поискване.' },
    ],
    guideOutputEyebrow: 'Резултат от ръководството',
    guideOutputTitle: 'Всичко, от което техникът се нуждае, структурирано',
    guideOutputSub: 'Всяко генерирано ръководство включва тези елементи — не съкратени резюмета.',
    guideOutputs: [
      'Подредена последователност от стъпки', 'Моменти на затягане', 'Списък с необходими инструменти',
      'OEM референции на части', 'Предупреждения за безопасност', 'Инженерни диаграми',
      'Ниво на трудност', 'Приблизително време',
    ],
    whyEyebrow: 'Защо Motixi',
    whyTitle: 'Не е чатбот. Не е ръководство.\nНещо по-добро.',
    differentiators: [
      { vs: 'срещу PDF ръководства', title: 'Търсим. Мигновен. Структуриран.', desc: 'Без изтегляне. Без превъртане на 400 страници. Естествен език на входа, структурирана процедура на изхода.' },
      { vs: 'срещу теми във форуми', title: 'Авторитетен, не анекдотичен', desc: 'Изграден от знанията на ИИ — не от мнения във форуми, които може да не съответстват на вашата точна комплектация.' },
      { vs: 'срещу общ ИИ чат', title: 'Доменно-ориентиран резултат', desc: 'Motixi е създаден за автомобилен ремонт. Разбира моменти на затягане, OEM референции и изисквания за инструменти.' },
    ],
    ctaEyebrow: 'Започнете днес',
    ctaTitle: 'Генерирайте първото си ръководство безплатно.',
    ctaSub: 'Без кредитна карта. Без настройка. Само резултати.',
    alreadyHaveAccount: 'Вече имате акаунт →',
  },

  contactPage: {
    eyebrow: 'Контакти',
    title: 'Нека поговорим',
    sub: 'За партньорства, корпоративни внедрявания, консултации, продуктова стратегия или въпроси за Motixi — отговарям лично.',
    founderName: 'Кирило Петров',
    founderRole: 'Основател и CEO, Motixi',
    email: 'Имейл',
    linkedin: 'LinkedIn',
    getInTouchTitle: 'Свържете се директно',
    getInTouchP1: 'Отговарям лично на всяко съобщение. Независимо дали оценявате Motixi за вашия сервиз, проучвате корпоративно внедряване, търсите консултантски разговор или просто искате да обсъдите проблемното пространство — достъпен съм.',
    getInTouchP2: 'Най-бързият път е имейл. LinkedIn също работи за по-формално представяне.',
    responseNote: 'Обикновено отговаря в рамките на 24 часа.',
  },

  newGuide: {
    backToGuides: 'Към ръководствата',
  },

  countrySelector: {
    title: 'Изберете регион',
    sub: 'Това задава езика на приложението. Можете да го промените по-късно в настройките.',
    confirm: 'Продължи',
  },

  footer: {
    product: 'Продукт',
    about: 'За нас',
    contact: 'Контакти',
    email: 'Имейл',
  },

  time: {
    justNow: 'току-що',
    minutesAgo: 'мин преди',
    hoursAgo: 'ч преди',
    yesterday: 'вчера',
    daysAgo: 'дн преди',
  },
};

// ── Dictionary map ───────────────────────────────────────────────────────────

export const dictionaries: Record<Locale, Translations> = { en, uk, bg };

// ── React context ────────────────────────────────────────────────────────────

export const I18nContext = createContext<Translations>(en);

export function useT(): Translations {
  return useContext(I18nContext);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  // 1. localStorage (primary, client-side)
  const stored = localStorage.getItem(LOCALE_KEY);
  if (stored === 'en' || stored === 'uk' || stored === 'bg') return stored;
  // 2. cookie fallback (set by middleware for SSR sync)
  const cookie = document.cookie
    .split('; ')
    .find((c) => c.startsWith('motix_locale='));
  if (cookie) {
    const val = cookie.split('=')[1];
    if (val === 'en' || val === 'uk' || val === 'bg') return val;
  }
  return 'en';
}

const LOCALE_PREFIX_MAP: Record<Locale, string> = {
  en: '',
  uk: '/ua',
  bg: '/bg',
};

/** Returns the URL prefix for a given locale ('' for English). */
export function getLocalePrefix(locale?: Locale): string {
  return LOCALE_PREFIX_MAP[locale ?? getLocale()];
}

export function setLocale(locale: Locale): void {
  localStorage.setItem(LOCALE_KEY, locale);
  // Sync to cookie so middleware picks it up on next navigation
  document.cookie = `motix_locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
}

export function getCountry(): Country | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(COUNTRY_KEY);
  if (stored === 'global' || stored === 'ukraine' || stored === 'bulgaria') return stored;
  return null;
}

export function setCountry(country: Country): void {
  localStorage.setItem(COUNTRY_KEY, country);
  setLocale(COUNTRY_LOCALE_MAP[country]);
}

export function hasChosenCountry(): boolean {
  return getCountry() !== null;
}
