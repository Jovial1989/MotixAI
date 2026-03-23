// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Ukrainian (`uk`).
class SUk extends S {
  SUk([String locale = 'uk']) : super(locale);

  @override
  String get appName => 'Motixi';

  @override
  String get aiPoweredRepairGuides => 'ШІ-інструкції з ремонту';

  @override
  String get welcomeBack => 'З поверненням';

  @override
  String get signInToAccount => 'Увійдіть у свій акаунт';

  @override
  String get email => 'Електронна пошта';

  @override
  String get emailPlaceholder => 'you@example.com';

  @override
  String get password => 'Пароль';

  @override
  String get passwordPlaceholder => '••••••••';

  @override
  String get enterValidEmail => 'Введіть дійсну адресу';

  @override
  String get minSixChars => 'Мінімум 6 символів';

  @override
  String get signIn => 'Увійти';

  @override
  String get noAccountSignUp => 'Немає акаунту? Зареєструйтесь';

  @override
  String get continueAsGuest => 'Продовжити як гість →';

  @override
  String get createAccount => 'Створити акаунт';

  @override
  String get getStarted => 'Розпочніть з Motixi';

  @override
  String get confirmPassword => 'Підтвердити пароль';

  @override
  String get repeatPassword => 'Повторіть пароль';

  @override
  String get passwordsDoNotMatch => 'Паролі не збігаються';

  @override
  String get alreadyHaveAccount => 'Вже є акаунт? Увійти';

  @override
  String get back => 'Назад';

  @override
  String get onboardingWelcome => 'Ласкаво просимо до Motixi';

  @override
  String get onboardingWelcomeSub =>
      'ШІ-інструкції з ремонту, які знають ваш транспорт, деталі та роботу — все в одному місці.';

  @override
  String get onboardingFeatures => 'Все для правильного ремонту';

  @override
  String get onboardingFeaturesSub =>
      'Від заміни масла до ременя ГРМ — точні покрокові інструкції з ШІ-ілюстраціями.';

  @override
  String get featStepByStep => 'Покрокові інструкції';

  @override
  String get featStepByStepDesc =>
      'Автогенерація з даних OEM та перевірених джерел';

  @override
  String get featAiIllustrations => 'ШІ-ілюстрації';

  @override
  String get featAiIllustrationsDesc =>
      'Візуальна довідка для кожного кроку ремонту';

  @override
  String get featAskGuide => 'Запитайте інструкцію';

  @override
  String get featAskGuideDesc =>
      'Отримайте миттєві відповіді на питання з ремонту';

  @override
  String get choosePlan => 'Оберіть план';

  @override
  String get choosePlanSub => 'Ви зможете змінити це пізніше.';

  @override
  String get planTrial => '7-денний пробний період';

  @override
  String get planTrialDesc => 'Повний доступ на 7 днів. Без картки.';

  @override
  String get planTrialBadge => 'Рекомендовано';

  @override
  String get planFree => 'Безкоштовний (обмежений)';

  @override
  String get planFreeDesc => '5 інструкцій на місяць. Базові функції.';

  @override
  String get continueBtn => 'Далі';

  @override
  String get skipToPlan => 'Перейти до вибору плану';

  @override
  String get startFreeTrial => 'Почати пробний період';

  @override
  String get continueFree => 'Продовжити безкоштовно';

  @override
  String get settingUp => 'Налаштування…';

  @override
  String get somethingWentWrong => 'Щось пішло не так';

  @override
  String get noGuidesYet => 'Ще немає інструкцій';

  @override
  String get noGuidesDesc =>
      'Введіть запит на ремонт вище, щоб згенерувати першу ШІ-інструкцію.';

  @override
  String get newGuide => 'Нова інструкція';

  @override
  String get signUpToGenerate => 'Зареєструйтесь для генерації';

  @override
  String get generating => 'Генерація…';

  @override
  String get guestBanner => 'Перегляд як гість — лише читання.';

  @override
  String get guestBannerSignUp => 'Зареєструватися';

  @override
  String get deleteGuide => 'Видалити інструкцію';

  @override
  String deleteGuideConfirm(String title) {
    return 'Видалити \"$title\"?';
  }

  @override
  String get cancel => 'Скасувати';

  @override
  String get delete => 'Видалити';

  @override
  String get search => 'Пошук…';

  @override
  String get safetyNotes => 'Примітки безпеки';

  @override
  String get toolsRequired => 'Необхідні інструменти';

  @override
  String procedureSteps(int count) {
    return 'ПРОЦЕДУРА — $count КРОКІВ';
  }

  @override
  String get details => 'Деталі';

  @override
  String get searchingRefs => 'Пошук посилань…';

  @override
  String get analyzingRefs => 'Аналіз схеми…';

  @override
  String get generatingIllustration => 'Генерація ілюстрації…';

  @override
  String get queued => 'В черзі…';

  @override
  String get preparingIllustration => 'Підготовка ілюстрації…';

  @override
  String get tapToExpand => '⤢ Натисніть для збільшення';

  @override
  String get tapToRegenerate => 'Натисніть для перегенерації';

  @override
  String sourceBacked(String provider) {
    return '📄 $provider';
  }

  @override
  String get webSynthesis => '🌐 Веб-синтез';

  @override
  String get aiGenerated => '⚡ ШІ генерація';

  @override
  String get askAiAboutStep => 'Запитати ШІ про цей крок';

  @override
  String get askAiHint => 'напр. Який момент затяжки тут?';

  @override
  String get prev => 'Назад';

  @override
  String get next => 'Далі';

  @override
  String stepOf(int current, int total) {
    return '$current / $total';
  }

  @override
  String get torque => 'Момент затяжки';

  @override
  String get warning => 'Попередження';

  @override
  String get make => 'Марка';

  @override
  String get model => 'Модель';

  @override
  String get year => 'Рік';

  @override
  String get selectMake => 'Оберіть марку…';

  @override
  String get selectModel => 'Оберіть модель…';

  @override
  String get anyYear => 'Будь-який рік (необов\'язково)';

  @override
  String get selectMakeFirst => 'Спочатку оберіть марку';

  @override
  String get partRepairDesc => 'Деталь / опис ремонту';

  @override
  String get oemPartNumber => 'OEM / номер деталі';

  @override
  String get didYouMean => 'Можливо ви мали на увазі:';

  @override
  String get review => 'Перевірити';

  @override
  String get generateGuide => 'Генерувати інструкцію';

  @override
  String get confirmGenDesc =>
      'ШІ згенерує покрокову інструкцію з ремонту із зображеннями для кожного кроку.';

  @override
  String get vehicle => 'Транспорт';

  @override
  String get repair => 'Ремонт';

  @override
  String get partNo => 'Номер деталі';

  @override
  String get required => 'обов\'язково';

  @override
  String get optional => 'необов\'язково';

  @override
  String get history => 'Історія';

  @override
  String get noHistoryYet => 'Ще немає історії';

  @override
  String get noHistoryDesc => 'Згенеровані інструкції з\'являться тут.';

  @override
  String get profile => 'Профіль';

  @override
  String get accountSection => 'Акаунт';

  @override
  String get emailLabel => 'Електронна пошта';

  @override
  String get roleLabel => 'Роль';

  @override
  String get tenantLabel => 'Тенант';

  @override
  String get planSection => 'План';

  @override
  String get proActive => '⚡ Pro план активний';

  @override
  String get proActiveDesc =>
      'Безлімітні інструкції · Пріоритетні зображення · Доступ до API';

  @override
  String get trialActive => 'Пробний період активний';

  @override
  String trialDaysRemaining(int days) {
    return 'Залишилось $days дн.';
  }

  @override
  String get freePlan => 'Безкоштовний план';

  @override
  String get freePlanDesc => '5 інструкцій/місяць. Введіть промокод для Pro.';

  @override
  String get guideHistory => 'Історія інструкцій';

  @override
  String get promoCode => 'ПРОМОКОД';

  @override
  String get enterPromoCode => 'Введіть промокод…';

  @override
  String get apply => 'Застосувати';

  @override
  String get promoApplied => 'Промокод застосовано! Тепер у вас Pro доступ.';

  @override
  String get signOut => 'Вийти';

  @override
  String get countrySelectTitle => 'Оберіть регіон';

  @override
  String get countrySelectSub =>
      'Це встановить мову додатку. Ви зможете змінити її пізніше в налаштуваннях.';

  @override
  String get countryGlobal => '🌐  Глобальний (English)';

  @override
  String get countryUkraine => '🇺🇦  Україна';

  @override
  String get countryBulgaria => '🇧🇬  Болгарія';

  @override
  String get countryConfirm => 'Продовжити';

  @override
  String get loading => 'Завантаження…';

  @override
  String get retry => 'Повторити';

  @override
  String get error => 'Помилка';
}
