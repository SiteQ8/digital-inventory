// What each service really offers after a death, and what its owner can prepare today.
// level "read": the official page was read on the checked date.
// level "link": the official page exists but could not be read by the build, so the entry
//               says only what the page title states and sends the reader to the source.
// level "advice": no single official source, general practice.

export const CHECKED = '2026-11-11';

export const CATEGORIES = [
  { id: 'core', ar: 'الحسابات الأساسية', en: 'Core accounts' },
  { id: 'social', ar: 'التواصل الاجتماعي', en: 'Social media' },
  { id: 'chat', ar: 'المراسلة', en: 'Messaging' },
  { id: 'keys', ar: 'مدير كلمات المرور', en: 'Password manager' },
  { id: 'money', ar: 'المال', en: 'Money' },
  { id: 'subs', ar: 'الاشتراكات', en: 'Subscriptions' },
  { id: 'devices', ar: 'الأجهزة', en: 'Devices' },
  { id: 'web', ar: 'النطاقات والمواقع', en: 'Domains and sites' },
  { id: 'other', ar: 'غير ذلك', en: 'Other' },
];

export const ACTIONS = [
  { id: 'handover', ar: 'يُسلَّم إلى المستلم', en: 'Hand over to the recipient' },
  { id: 'memorial', ar: 'يبقى للذكرى', en: 'Keep as a memorial' },
  { id: 'close', ar: 'يُغلق', en: 'Close it' },
  { id: 'decide', ar: 'يقرر المستلم', en: 'The recipient decides' },
];

export const SERVICES = [
  {
    id: 'apple', cat: 'core', level: 'read', money: false,
    name: { ar: 'حساب Apple', en: 'Apple Account' },
    source: 'https://support.apple.com/102631',
    path: {
      ar: 'تتيح Apple تعيين جهة اتصال الإرث الرقمي (Legacy Contact) فتطلب الوصول بعد الوفاة بمفتاح الوصول وشهادة الوفاة، وتصل إلى الصور والرسائل والملاحظات والملفات والنسخ الاحتياطية، ولا تصل إلى كلمات المرور المحفوظة ولا إلى المشتريات والاشتراكات.',
      en: 'Apple lets you name a Legacy Contact who asks for access after your death with the access key and a death certificate. They reach photos, messages, notes, files and backups, but not saved passwords, purchases or subscriptions.',
    },
    prepare: [
      { id: 'contact', ar: 'عيّن جهة اتصال الإرث الرقمي من إعدادات حسابك', en: 'Add a Legacy Contact in your account settings' },
      { id: 'key', ar: 'اطبع مفتاح الوصول واحفظه مع أوراقك أو أرسله إلى المستلم', en: 'Print the access key and keep it with your papers, or send it to the recipient' },
      { id: 'tell', ar: 'أخبر المستلم أين يجد المفتاح', en: 'Tell the recipient where the key is' },
    ],
    after: {
      ar: 'يقدّم المستلم مفتاح الوصول وشهادة الوفاة إلى Apple ثم ينزّل ما يريد حفظه.',
      en: 'The recipient gives Apple the access key and the death certificate, then downloads what they want to keep.',
    },
  },
  {
    id: 'google', cat: 'core', level: 'read', money: false,
    name: { ar: 'حساب Google', en: 'Google Account' },
    source: 'https://support.google.com/accounts/answer/3036546',
    path: {
      ar: 'يتيح مدير الحساب غير النشط (Inactive Account Manager) أن تختار مدة انقطاع، وبعدها ترسل Google رسالتك إلى من اخترتهم حتى عشرة أشخاص، ولك أن تشاركهم بيانات تحددها، وقد تحذف Google الحساب المنقطع عامين إذا لم تضع خطة.',
      en: 'Inactive Account Manager lets you pick a waiting period. After it, Google emails up to ten people you chose, with the data you decided to share. With no plan, Google may delete an account left inactive for two years.',
    },
    prepare: [
      { id: 'plan', ar: 'فعّل مدير الحساب غير النشط واختر مدة الانقطاع', en: 'Turn on Inactive Account Manager and pick the waiting period' },
      { id: 'data', ar: 'اختر البيانات التي يستلمها كل شخص', en: 'Choose the data each person receives' },
      { id: 'phone', ar: 'تأكد من رقم هاتف كل مستلم لأن Google تتحقق منه قبل التسليم', en: 'Check each recipient\'s phone number, since Google verifies it before sharing' },
    ],
    after: {
      ar: 'تصل إلى المستلم رسالة من Google فيها رابط التنزيل فينزّل البيانات منه.',
      en: 'The recipient gets an email from Google with a download link and saves the data from it.',
    },
  },
  {
    id: 'microsoft', cat: 'core', level: 'read', money: false,
    name: { ar: 'حساب Microsoft', en: 'Microsoft account' },
    source: 'https://support.microsoft.com/office/ebbd2860-917e-4b39-9913-212362da6b2f',
    path: {
      ar: 'لا تمنح Microsoft أحداً الوصول إلى حساب المتوفى عبر الدعم، وتشترط أمراً قضائياً قبل النظر في تسليم أي محتوى، ويُغلق الحساب المنقطع تلقائياً بعد عامين، لذا فالتحضير المسبق هو الطريق العملي.',
      en: 'Microsoft support does not give anyone access to a deceased person\'s account and asks for a court order before it considers releasing content. An unused account closes by itself after two years, so preparing ahead is the practical route.',
    },
    prepare: [
      { id: 'move', ar: 'انقل ما يهم أهلك من OneDrive و Outlook إلى مكان يصلون إليه', en: 'Move what matters to your family out of OneDrive and Outlook to a place they can reach' },
      { id: 'where', ar: 'دوّن في هذه الورقة أين تُحفظ بيانات الدخول', en: 'Write on this sheet where the sign-in details are kept' },
    ],
    after: {
      ar: 'من يعرف بيانات الدخول يستطيع إغلاق الحساب بنفسه، وما عدا ذلك يحتاج إلى أمر قضائي.',
      en: 'Whoever knows the sign-in details can close the account. Anything else needs a court order.',
    },
  },
  {
    id: 'facebook', cat: 'social', level: 'read', money: false,
    name: { ar: 'Facebook', en: 'Facebook' },
    source: 'https://www.facebook.com/help/150486848354038',
    path: {
      ar: 'يتحول الحساب إلى حساب تذكاري بطلب صحيح، ولا تعطي Facebook بيانات الدخول لأحد، ويحق لأفراد الأسرة المقربين بعد التحقق منهم طلب حذف الحساب.',
      en: 'The account becomes a memorialized account after a valid request. Facebook gives nobody the sign-in details. Verified immediate family can ask for the account to be deleted.',
    },
    prepare: [
      { id: 'wish', ar: 'قرر هل يبقى الحساب تذكارياً أو يُحذف ودوّن قرارك هنا', en: 'Decide whether the account stays as a memorial or is deleted, and record it here' },
    ],
    after: {
      ar: 'يبلّغ أحد أفراد الأسرة Facebook بالوفاة ويطلب ما اخترته.',
      en: 'A family member reports the death to Facebook and asks for what you chose.',
    },
  },
  {
    id: 'instagram', cat: 'social', level: 'link', money: false,
    name: { ar: 'Instagram', en: 'Instagram' },
    source: 'https://help.instagram.com/231764660354188',
    path: {
      ar: 'تحوّل Instagram حساب المتوفى إلى حساب تذكاري تُقيَّد فيه طرق التفاعل، والتفاصيل في صفحة المساعدة.',
      en: 'Instagram memorializes a deceased person\'s profile and limits how people interact with it. The help page has the details.',
    },
    prepare: [
      { id: 'wish', ar: 'قرر هل يبقى الحساب تذكارياً أو يُزال ودوّن قرارك هنا', en: 'Decide whether the profile stays as a memorial or is removed, and record it here' },
    ],
    after: {
      ar: 'يبلّغ أحد أفراد الأسرة Instagram بالوفاة من صفحة المساعدة.',
      en: 'A family member reports the death to Instagram from the help page.',
    },
  },
  {
    id: 'x', cat: 'social', level: 'read', money: false,
    name: { ar: 'X', en: 'X' },
    source: 'https://help.x.com/en/rules-and-policies/contact-x-about-a-deceased-family-members-account',
    path: {
      ar: 'تقبل X طلب تعطيل الحساب من المخوَّل بالتصرف في التركة أو من قريب مباشر بعد التحقق، وتطلب هويته وشهادة الوفاة، ولا تمنح أحداً الوصول إلى الحساب.',
      en: 'X accepts a deactivation request from someone authorized to act for the estate or a verified immediate family member, and asks for their ID and the death certificate. It gives nobody access to the account.',
    },
    prepare: [
      { id: 'save', ar: 'نزّل أرشيف حسابك إن أردت أن يبقى لأهلك', en: 'Download your archive if you want your family to have it' },
    ],
    after: {
      ar: 'يقدّم القريب طلب التعطيل ثم يرسل الهوية وشهادة الوفاة حين تطلبهما X.',
      en: 'A relative files the deactivation request, then sends the ID and death certificate when X asks.',
    },
  },
  {
    id: 'linkedin', cat: 'social', level: 'link', money: false,
    name: { ar: 'LinkedIn', en: 'LinkedIn' },
    source: 'https://www.linkedin.com/help/linkedin/answer/a1336663/memorialize-or-close-the-account-of-a-deceased-member',
    path: {
      ar: 'تتيح LinkedIn تحويل حساب العضو المتوفى إلى حساب تذكاري أو إغلاقه، والشروط في صفحة المساعدة.',
      en: 'LinkedIn can memorialize or close a deceased member\'s account. The help page lists the conditions.',
    },
    prepare: [
      { id: 'wish', ar: 'قرر هل يبقى الحساب تذكارياً أو يُغلق ودوّن قرارك هنا', en: 'Decide whether the account is memorialized or closed, and record it here' },
    ],
    after: {
      ar: 'يقدّم أحد أفراد الأسرة الطلب من صفحة المساعدة.',
      en: 'A family member files the request from the help page.',
    },
  },
  {
    id: 'whatsapp', cat: 'chat', level: 'link', money: false,
    name: { ar: 'WhatsApp', en: 'WhatsApp' },
    source: 'https://faq.whatsapp.com/828406668498455',
    path: {
      ar: 'تحذف WhatsApp الحسابات المنقطعة بعد مدة تذكرها في صفحتها، ومحادثاتك محفوظة على هاتفك وفي نسخته الاحتياطية، لذا فمن يفتح الهاتف يصل إليها.',
      en: 'WhatsApp deletes inactive accounts after the period stated on its page. Your chats live on your phone and in its backup, so whoever unlocks the phone reaches them.',
    },
    prepare: [
      { id: 'backup', ar: 'قرر هل تريد أن تبقى محادثاتك لأهلك وفعّل النسخ الاحتياطي إن أردت', en: 'Decide whether your chats should stay for your family, and turn on backup if so' },
      { id: 'groups', ar: 'سمِّ مشرفاً آخر في المجموعات التي تديرها', en: 'Name another admin in the groups you run' },
    ],
    after: {
      ar: 'يحفظ المستلم المحادثات التي أوصيت بها من الهاتف قبل إيقاف الرقم.',
      en: 'The recipient saves the chats you named from the phone before the number is stopped.',
    },
  },
  {
    id: 'telegram', cat: 'chat', level: 'read', money: false,
    name: { ar: 'Telegram', en: 'Telegram' },
    source: 'https://telegram.org/faq',
    path: {
      ar: 'يحذف Telegram الحساب المنقطع تلقائياً ومعه الرسائل والوسائط وجهات الاتصال، والمدة الافتراضية ثمانية عشر شهراً وتستطيع تغييرها من الإعدادات.',
      en: 'Telegram deletes an inactive account by itself, with its messages, media and contacts. The default is 18 months and you can change it in Settings.',
    },
    prepare: [
      { id: 'period', ar: 'اختر مدة الحذف التلقائي التي تناسبك من الإعدادات', en: 'Pick the self-destruct period that suits you in Settings' },
      { id: 'channels', ar: 'سمِّ مشرفاً آخر في القنوات والمجموعات التي تملكها', en: 'Name another admin in the channels and groups you own' },
    ],
    after: {
      ar: 'يُترك الحساب حتى يُحذف تلقائياً أو يحذفه المستلم من الهاتف.',
      en: 'The account is left to delete itself, or the recipient deletes it from the phone.',
    },
  },
  {
    id: 'bitwarden', cat: 'keys', level: 'read', money: false,
    name: { ar: 'Bitwarden', en: 'Bitwarden' },
    source: 'https://bitwarden.com/help/emergency-access/',
    path: {
      ar: 'يتيح الوصول الطارئ (Emergency Access) أن تسمّي شخصاً يطلب فتح خزنتك، فإن لم ترفض الطلب خلال مهلة تحددها فُتحت له للعرض أو للاستلام الكامل، وتسمية الأشخاص متاحة للحسابات المدفوعة.',
      en: 'Emergency Access lets you name a person who can request your vault. If you do not reject the request within the wait time you set, it opens for them, to view or to take over. Naming contacts needs a paid account.',
    },
    prepare: [
      { id: 'contact', ar: 'أضف جهة اتصال للطوارئ واختر مستوى الوصول', en: 'Add a trusted emergency contact and choose the access level' },
      { id: 'wait', ar: 'اختر مهلة تكفيك لرفض طلب لم تأذن به', en: 'Pick a wait time long enough for you to reject a request you did not approve' },
    ],
    after: {
      ar: 'يطلب المستلم الوصول من حسابه ثم ينتظر انتهاء المهلة.',
      en: 'The recipient requests access from their own account and waits for the wait time to pass.',
    },
  },
  {
    id: 'manager', cat: 'keys', level: 'advice', money: false,
    name: { ar: 'مدير كلمات مرور آخر', en: 'Another password manager' },
    path: {
      ar: 'مدير كلمات المرور هو مفتاح بقية الحسابات، فمن يصل إليه يصل إلى كل ما فيه.',
      en: 'A password manager is the key to the other accounts. Whoever reaches it reaches everything in it.',
    },
    prepare: [
      { id: 'feature', ar: 'ابحث في مديرك عن خاصية الوصول الطارئ وفعّلها إن وُجدت', en: 'Look for an emergency access feature in your manager and turn it on if it has one' },
      { id: 'paper', ar: 'اكتب كلمة المرور الرئيسة على ورقة واحفظها في مكان آمن ودوّن هنا مكانها فقط', en: 'Write the master password on paper, keep it somewhere safe, and record only its place here' },
    ],
    after: {
      ar: 'يفتح المستلم الخزنة بالطريقة التي أعددتها ثم ينقل ما يلزم.',
      en: 'The recipient opens the vault the way you prepared, then moves what is needed.',
    },
  },
  {
    id: 'bank', cat: 'money', level: 'advice', money: true,
    name: { ar: 'حساب بنكي', en: 'Bank account' },
    path: {
      ar: 'أموال الحساب تنتقل إلى الورثة بالطريق الرسمي لا ببيانات الدخول، ويكفي أن يعرف أهلك في أي بنك حساباتك.',
      en: 'Money in the account passes to the heirs through the official route, not through sign-in details. It is enough that your family knows which banks you use.',
    },
    prepare: [
      { id: 'list', ar: 'دوّن اسم البنك ونوع الحساب فقط دون أرقام', en: 'Record the bank name and account type only, with no numbers' },
    ],
    after: {
      ar: 'يراجع الورثة البنك بالمستندات الرسمية التي يطلبها، ولا يستخدم أحد بيانات دخول المتوفى.',
      en: 'The heirs go to the bank with the official documents it asks for. Nobody uses the deceased person\'s sign-in.',
    },
  },
  {
    id: 'wallet', cat: 'money', level: 'advice', money: true,
    name: { ar: 'محفظة أصول رقمية', en: 'Crypto wallet' },
    path: {
      ar: 'من يملك عبارة الاسترداد يملك المحفظة، وإن ضاعت العبارة ضاع ما فيها ولا جهة تعيده.',
      en: 'Whoever holds the recovery phrase holds the wallet. If the phrase is lost, what it holds is lost and nobody can restore it.',
    },
    prepare: [
      { id: 'phrase', ar: 'احفظ عبارة الاسترداد على ورق أو معدن في مكان آمن ولا تكتبها هنا', en: 'Keep the recovery phrase on paper or metal somewhere safe, and never type it here' },
      { id: 'place', ar: 'دوّن هنا مكان حفظها فقط', en: 'Record only where it is kept' },
      { id: 'test', ar: 'جرّب الاسترداد مرة حتى تتأكد أن العبارة صحيحة', en: 'Try a restore once to be sure the phrase is right' },
    ],
    after: {
      ar: 'يستعيد المستلم المحفظة بالعبارة على جهاز موثوق ثم تُقسَّم الأصول مع بقية التركة.',
      en: 'The recipient restores the wallet with the phrase on a trusted device. The assets are then divided with the rest of the estate.',
    },
  },
  {
    id: 'trading', cat: 'money', level: 'advice', money: true,
    name: { ar: 'منصة تداول أو استثمار', en: 'Trading or investment platform' },
    path: {
      ar: 'الأصول لدى المنصة تنتقل إلى الورثة بإجراءاتها الرسمية، فيكفي أن يعرف أهلك بوجود الحساب.',
      en: 'Assets held by a platform pass to the heirs through its official process. Your family only needs to know the account exists.',
    },
    prepare: [
      { id: 'list', ar: 'دوّن اسم المنصة فقط دون أرقام ولا بيانات دخول', en: 'Record the platform name only, with no numbers or sign-in details' },
    ],
    after: {
      ar: 'يتواصل الورثة مع المنصة بالمستندات الرسمية التي تطلبها.',
      en: 'The heirs contact the platform with the official documents it asks for.',
    },
  },
  {
    id: 'subscription', cat: 'subs', level: 'advice', money: false,
    name: { ar: 'اشتراك مدفوع', en: 'Paid subscription' },
    path: {
      ar: 'الاشتراك يستمر في الخصم حتى يلغيه أحد أو تُوقف وسيلة الدفع.',
      en: 'A subscription keeps charging until someone cancels it or the payment method stops.',
    },
    prepare: [
      { id: 'pay', ar: 'دوّن وسيلة الدفع المرتبطة حتى يُعرف من أين يُخصم', en: 'Record the payment method so it is clear where the charge comes from' },
    ],
    after: {
      ar: 'يلغي المستلم الاشتراك أو ينقله إلى اسمه إن كان الأهل يستخدمونه.',
      en: 'The recipient cancels it, or moves it to their own name if the family uses it.',
    },
  },
  {
    id: 'phone', cat: 'devices', level: 'advice', money: false,
    name: { ar: 'هاتف أو جهاز لوحي', en: 'Phone or tablet' },
    path: {
      ar: 'الهاتف يستقبل رموز التحقق لأغلب الحسابات، فمن يفتحه يستطيع إتمام بقية الخطوات.',
      en: 'The phone receives the verification codes for most accounts. Whoever unlocks it can finish the other steps.',
    },
    prepare: [
      { id: 'code', ar: 'اكتب رمز الفتح على ورقة واحفظها في مكان آمن ودوّن هنا مكانها فقط', en: 'Write the unlock code on paper, keep it somewhere safe, and record only its place here' },
      { id: 'line', ar: 'دوّن اسم شركة الاتصالات حتى لا يُوقف الرقم قبل إتمام الخطوات', en: 'Record the mobile operator so the number is not stopped before the steps are done' },
    ],
    after: {
      ar: 'يبقى الرقم يعمل حتى تنتهي خطوات بقية الحسابات ثم يُوقف.',
      en: 'The number stays active until the other accounts are handled, then it is stopped.',
    },
  },
  {
    id: 'computer', cat: 'devices', level: 'advice', money: false,
    name: { ar: 'حاسوب أو قرص تخزين', en: 'Computer or storage drive' },
    path: {
      ar: 'الجهاز المشفَّر لا يُفتح دون كلمة مروره أو مفتاح الاسترداد.',
      en: 'An encrypted device does not open without its password or recovery key.',
    },
    prepare: [
      { id: 'code', ar: 'احفظ كلمة مرور الجهاز ومفتاح الاسترداد على ورقة في مكان آمن ودوّن هنا مكانها فقط', en: 'Keep the device password and recovery key on paper somewhere safe, and record only the place here' },
    ],
    after: {
      ar: 'ينسخ المستلم ما أوصيت به ثم يمسح الجهاز قبل التصرف فيه.',
      en: 'The recipient copies what you named, then wipes the device before passing it on.',
    },
  },
  {
    id: 'domain', cat: 'web', level: 'advice', money: true,
    name: { ar: 'نطاق أو موقع', en: 'Domain or website' },
    path: {
      ar: 'النطاق الذي لا يُجدَّد ينتهي ثم يشتريه غيرك، وتتوقف معه المواقع والبريد المرتبط به.',
      en: 'A domain that is not renewed expires and someone else buys it. The sites and email on it stop with it.',
    },
    prepare: [
      { id: 'registrar', ar: 'دوّن اسم المسجِّل وتاريخ التجديد', en: 'Record the registrar and the renewal date' },
      { id: 'renew', ar: 'فعّل التجديد التلقائي أو سمِّ من يجدده', en: 'Turn on auto renewal or name who renews it' },
    ],
    after: {
      ar: 'يجدّد المستلم النطاق قبل انتهائه ثم ينقله إلى حسابه لدى المسجِّل.',
      en: 'The recipient renews the domain before it expires, then moves it to their own account at the registrar.',
    },
  },
  {
    id: 'custom', cat: 'other', level: 'advice', money: false,
    name: { ar: 'حساب أو أصل آخر', en: 'Another account or asset' },
    path: {
      ar: 'دوّن ما يكفي ليعرف المستلم بوجوده وكيف يصل إليه.',
      en: 'Record enough for the recipient to know it exists and how to reach it.',
    },
    prepare: [],
    after: {
      ar: 'يتصرف المستلم فيه بحسب ما أوصيت.',
      en: 'The recipient handles it as you asked.',
    },
  },
];

export function service(id) {
  return SERVICES.find((s) => s.id === id) || null;
}
