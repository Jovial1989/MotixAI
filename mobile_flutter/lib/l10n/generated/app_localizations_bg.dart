// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Bulgarian (`bg`).
class SBg extends S {
  SBg([String locale = 'bg']) : super(locale);

  @override
  String get appName => 'Motixi';

  @override
  String get aiPoweredRepairGuides => 'ИИ ремонтни ръководства';

  @override
  String get welcomeBack => 'Добре дошли отново';

  @override
  String get signInToAccount => 'Влезте в акаунта си';

  @override
  String get email => 'Имейл';

  @override
  String get emailPlaceholder => 'you@example.com';

  @override
  String get password => 'Парола';

  @override
  String get passwordPlaceholder => '••••••••';

  @override
  String get enterValidEmail => 'Въведете валиден имейл';

  @override
  String get minSixChars => 'Минимум 6 символа';

  @override
  String get signIn => 'Вход';

  @override
  String get noAccountSignUp => 'Нямате акаунт? Регистрирайте се';

  @override
  String get continueAsGuest => 'Стартирай демо →';

  @override
  String get createAccount => 'Създай акаунт';

  @override
  String get getStarted => 'Започнете с Motixi';

  @override
  String get confirmPassword => 'Потвърдете паролата';

  @override
  String get repeatPassword => 'Повторете паролата';

  @override
  String get passwordsDoNotMatch => 'Паролите не съвпадат';

  @override
  String get alreadyHaveAccount => 'Вече имате акаунт? Вход';

  @override
  String get back => 'Назад';

  @override
  String get onboardingWelcome => 'Добре дошли в Motixi';

  @override
  String get onboardingWelcomeSub =>
      'ИИ-генерирани ремонтни ръководства, които познават вашето превозно средство, частите и задачите — всичко на едно място.';

  @override
  String get onboardingFeatures => 'Всичко необходимо за правилен ремонт';

  @override
  String get onboardingFeaturesSub =>
      'От смяна на масло до ангренажен ремък — прецизни стъпкови ръководства с ИИ илюстрации.';

  @override
  String get featStepByStep => 'Стъпка по стъпка ръководства';

  @override
  String get featStepByStepDesc =>
      'Автоматично генерирани от OEM данни и доверени източници';

  @override
  String get featAiIllustrations => 'ИИ илюстрации';

  @override
  String get featAiIllustrationsDesc =>
      'Визуална справка за всяка ремонтна стъпка';

  @override
  String get featAskGuide => 'Питайте ръководството';

  @override
  String get featAskGuideDesc =>
      'Получете моментални отговори на ремонтни въпроси';

  @override
  String get choosePlan => 'Изберете план';

  @override
  String get choosePlanSub =>
      'Стартирайте платения пробен период или активирайте достъпа с одобрен промокод.';

  @override
  String get planTrial => '7-дневен пробен период';

  @override
  String get planTrialDesc => 'Пълен достъп за 7 дни. Изисква се карта.';

  @override
  String get planTrialBadge => 'Препоръчано';

  @override
  String get planFree => 'Демо достъп';

  @override
  String get planFreeDesc =>
      'Режим само за преглед с 3 реални демо ръководства.';

  @override
  String get continueBtn => 'Продължи';

  @override
  String get skipToPlan => 'Към избор на план';

  @override
  String get startFreeTrial => 'Започни пробен период';

  @override
  String get upgradeToPro => 'Надстрой до Pro';

  @override
  String get trialBillingNote =>
      'Изисква се карта. Днес не се таксува. Подновява се след 7 дни, ако не бъде отменено.';

  @override
  String get billingStartFailed =>
      'Не успяхме да стартираме защитеното плащане. Моля, опитайте отново.';

  @override
  String get billingConnectionIssue =>
      'В момента няма връзка с плащането. Проверете мрежата и опитайте отново.';

  @override
  String get billingCancelled =>
      'Плащането е отменено. Регистрацията остава в изчакване.';

  @override
  String get billingTrialStarted => 'Вашият пробен период Pro е активен.';

  @override
  String get billingUpgradeSucceeded => 'Вашият Pro план е активен.';

  @override
  String get billingCheckoutTitle => 'Плащане';

  @override
  String get billingProfileUnavailable =>
      'Профилът за плащане все още не е настроен.';

  @override
  String get billingSupportUnavailable =>
      'В момента не успяхме да отворим поддръжката за плащания.';

  @override
  String get continueFree => 'Продължи';

  @override
  String get settingUp => 'Настройване…';

  @override
  String get somethingWentWrong => 'Нещо се обърка';

  @override
  String get noGuidesYet => 'Все още няма ръководства';

  @override
  String get noGuidesDesc =>
      'Въведете ремонтна заявка горе, за да генерирате първото ИИ ръководство.';

  @override
  String get sampleGuidesTitle => 'Примерни ръководства';

  @override
  String get sampleGuidesSubtitle =>
      '3 реални демо ръководства, създадени от Motixi — само в демо режим';

  @override
  String stepCountLabel(int count) {
    return '$count стъпки';
  }

  @override
  String get newGuide => 'Ново ръководство';

  @override
  String get signUpToGenerate => 'Регистрирайте се за генериране';

  @override
  String get generating => 'Генериране…';

  @override
  String get guestBanner =>
      'Демо режим — 3 реални демо ръководства в режим само за четене.';

  @override
  String get guestBannerSignUp => 'Регистрация';

  @override
  String get guestUpgradeTitle => 'Регистрирайте се, за да отключите повече';

  @override
  String get guestUpgradeDesc =>
      'Регистрирайте се, за да генерирате ръководства, да запазвате прогреса си и да питате ИИ за всяка стъпка.';

  @override
  String get availableInPro => 'Налично в Pro';

  @override
  String get deleteGuide => 'Изтрий ръководството';

  @override
  String deleteGuideConfirm(String title) {
    return 'Изтриване на \"$title\"?';
  }

  @override
  String get cancel => 'Отказ';

  @override
  String get delete => 'Изтрий';

  @override
  String get search => 'Търсене…';

  @override
  String get safetyNotes => 'Бележки за безопасност';

  @override
  String get toolsRequired => 'Необходими инструменти';

  @override
  String procedureSteps(int count) {
    return 'ПРОЦЕДУРА — $count СТЪПКИ';
  }

  @override
  String get details => 'Детайли';

  @override
  String get searchingRefs => 'Търсене на референции…';

  @override
  String get analyzingRefs => 'Анализ на диаграмата…';

  @override
  String get generatingIllustration => 'Генериране на илюстрация…';

  @override
  String get queued => 'На опашка…';

  @override
  String get preparingIllustration => 'Подготовка на илюстрация…';

  @override
  String get tapToExpand => '⤢ Натиснете за увеличаване';

  @override
  String get tapToRegenerate => 'Натиснете за регенериране';

  @override
  String sourceBacked(String provider) {
    return '📄 $provider';
  }

  @override
  String get webSynthesis => '🌐 Уеб синтез';

  @override
  String get aiGenerated => 'Професионално ремонтно ръководство с ИИ';

  @override
  String get askAiAboutStep => 'Попитай ИИ за тази стъпка';

  @override
  String get askAiHint => 'напр. Какъв въртящ момент за този болт?';

  @override
  String get prev => 'Назад';

  @override
  String get next => 'Напред';

  @override
  String stepOf(int current, int total) {
    return '$current / $total';
  }

  @override
  String get torque => 'Въртящ момент';

  @override
  String get warning => 'Предупреждение';

  @override
  String get make => 'Марка';

  @override
  String get model => 'Модел';

  @override
  String get year => 'Година';

  @override
  String get selectMake => 'Изберете марка…';

  @override
  String get selectModel => 'Изберете модел…';

  @override
  String get anyYear => 'Всяка година (по избор)';

  @override
  String get selectMakeFirst => 'Първо изберете марка';

  @override
  String get modelInputPlaceholder => 'напр. Qashqai, F-150…';

  @override
  String get partRepairDesc => 'Част / описание на ремонт';

  @override
  String get partInputPlaceholder =>
      'напр. Хидравлична помпа, спирачки, смяна на масло…';

  @override
  String get oemPartNumber => 'OEM / номер на част';

  @override
  String get oemInputPlaceholder => 'напр. 4633891';

  @override
  String get didYouMean => 'Имахте предвид:';

  @override
  String get review => 'Преглед';

  @override
  String get generateGuide => 'Генерирай ръководство';

  @override
  String get confirmGenDesc =>
      'ИИ ще генерира стъпково ремонтно ръководство с изображения за всяка стъпка.';

  @override
  String get vehicle => 'Превозно средство';

  @override
  String get repair => 'Ремонт';

  @override
  String get partNo => 'Номер на част';

  @override
  String get required => 'задължително';

  @override
  String get optional => 'по избор';

  @override
  String get history => 'История';

  @override
  String get noHistoryYet => 'Все още няма история';

  @override
  String get noHistoryDesc => 'Генерираните ръководства ще се появят тук.';

  @override
  String get profile => 'Профил';

  @override
  String get accountSection => 'Акаунт';

  @override
  String get emailLabel => 'Имейл';

  @override
  String get roleLabel => 'Роля';

  @override
  String get tenantLabel => 'Наемател';

  @override
  String get planSection => 'План';

  @override
  String get proActive => '⚡ Pro план активен';

  @override
  String get proActiveDesc =>
      'Неограничени ръководства · Приоритетно генериране на изображения · Пълна история на ръководствата';

  @override
  String get trialActive => 'Пробният период е активен';

  @override
  String trialDaysRemaining(int days) {
    return 'Остават $days дн.';
  }

  @override
  String get trialRenewsAfter =>
      'Картата е запазена. След 7-дневния пробен период планът се подновява като Pro, освен ако не бъде отменен.';

  @override
  String get freePlan => 'Активирането е в изчакване';

  @override
  String get freePlanDesc =>
      'Завършете плащането или приложете одобрен промокод, за да активирате пълния достъп.';

  @override
  String get languageSection => 'Език';

  @override
  String get currentLanguageLabel => 'Текущ език';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageUkrainian => 'Українська';

  @override
  String get languageBulgarian => 'Български';

  @override
  String get planLabel => 'План';

  @override
  String get priceLabel => 'Цена';

  @override
  String get priceAfterTrialLabel => 'Цена след пробния период';

  @override
  String get trialDaysLeftLabel => 'Оставащи дни';

  @override
  String get renewsOnLabel => 'Подновява се на';

  @override
  String get nextBillingDateLabel => 'Следваща дата на плащане';

  @override
  String get paymentMethodLabel => 'Метод на плащане';

  @override
  String get noPaymentMethodAdded => 'Все още няма добавена карта';

  @override
  String get cardLabel => 'Карта';

  @override
  String get includesLabel => 'Включва';

  @override
  String get freePlanIncludes => 'Изисква се плащане или одобрен промокод';

  @override
  String get proTrialPlan => 'Пробен период Pro';

  @override
  String get proPlanTitle => 'Pro';

  @override
  String get contactBillingSupport => 'Свържете се с поддръжката за плащания';

  @override
  String get manageSubscription => 'Управлявай абонамента';

  @override
  String get perMonthShort => 'мес';

  @override
  String get guideHistory => 'История на ръководствата';

  @override
  String get promoCode => 'ПРОМО КОД';

  @override
  String get enterPromoCode => 'Въведете промо код…';

  @override
  String get apply => 'Приложи';

  @override
  String get promoApplied => 'Промо кодът е приложен! Вече имате Pro достъп.';

  @override
  String get signOut => 'Излез';

  @override
  String get countrySelectTitle => 'Изберете регион';

  @override
  String get countrySelectSub =>
      'Това задава езика на приложението. Можете да го промените по-късно в настройките.';

  @override
  String get countryGlobal => '🌐  Глобален (English)';

  @override
  String get countryUkraine => '🇺🇦  Украйна';

  @override
  String get countryBulgaria => '🇧🇬  България';

  @override
  String get countryConfirm => 'Продължи';

  @override
  String get loading => 'Зареждане…';

  @override
  String get retry => 'Опитай отново';

  @override
  String get error => 'Грешка';
}
