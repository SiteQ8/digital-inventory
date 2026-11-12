# الجرد الرقمي

<div dir="rtl">

حين يتوفى شخص تضيع على أهله حساباته وصوره واشتراكاته ومحافظه، لأنهم لا يعرفون ما الذي يملكه ولا كيف يصلون إليه.

هذه أداة تجرد بها أصولك الرقمية وتحدد من يستلم كل أصل وماذا يُفعل به وأين يجد طريقة الدخول، ثم تطبع ورقة تُحفظ مع وصيتك ومعها دليل للأهل في الأيام الأولى.

**الاسم الحالي وصف مؤقت، وصاحب المشروع يسمّيه في `docs/assets/js/engine/brand.js`.**

## ما الذي تفعله

* تجرد تسعة عشر نوعاً من الأصول في تسع فئات، من حساب Apple و Google إلى البنوك والمحافظ الرقمية والنطاقات والأجهزة.
* تعرض لكل خدمة ما تتيحه فعلاً بعد الوفاة مع رابط مصدرها الرسمي وتاريخ قراءته.
* تعرض ما تجهّزه اليوم في كل خدمة، مثل تعيين جهة اتصال الإرث الرقمي لدى Apple أو تفعيل مدير الحساب غير النشط لدى Google.
* تحسب الجاهزية خطوة بخطوة، ويكتمل الختم حين لا يبقى ناقص وتُحفظ نسخة وتُطبع الورقة.
* تطبع ورقة الجرد ودليل الأهل على صفحتين بالعربية أو الإنجليزية.
* تحفظ نسخة مشفَّرة بعبارة مرور تختارها.
* تفتح دون اتصال بعد أول زيارة، وتُضاف إلى الشاشة الرئيسة في الهاتف.

## ما الذي لا تفعله

* لا تطلب كلمة مرور ولا رمزاً ولا عبارة استرداد ولا رقم بطاقة، وليس في الجرد حقل لها، وتنبّهك إن كتبت نصاً يشبهها.
* لا ترسل شيئاً إلى أي خادم، فلا حساب ولا تتبع ولا إعلانات، وسياسة أمان المحتوى في الصفحة تمنع أي اتصال.
* لا تفتي ولا تقسّم تركة، وما له قيمة مالية يُراجع فيه المختص الشرعي أو القانوني.

## التشغيل

</div>

```
npm test          # 20 tests, no dependencies
node scripts/ui.mjs      # walks both pages in a browser (needs Playwright)
node scripts/stamp.mjs   # after any change under docs/, refreshes the offline copy
npm run serve     # http://localhost:8899
```

<div dir="rtl">

الموقع ملفات ثابتة في `docs/` دون خطوة بناء ودون اعتماديات، وفيه صفحتان: الصفحة الرئيسة `index.html` والأداة `app.html`.

</div>

---

# Digital inventory

When someone dies, their family loses track of their accounts, photos, subscriptions and wallets, because nobody knows what exists or how to reach it.

This tool lets you list your digital assets, name who receives each one, say what should happen to it and where the way in is kept. It then prints a sheet to keep with your will, with a guide for the family's first days.

**The current name is a working description. The owner names the project in `docs/assets/js/engine/brand.js`.**

## What it does

* Lists 19 kinds of assets in 9 categories, from Apple and Google accounts to banks, crypto wallets, domains and devices.
* Shows what each service really offers after a death, with a link to its official source and the date it was read.
* Shows what you can prepare today, such as an Apple Legacy Contact or Google's Inactive Account Manager.
* Counts readiness step by step. The seal completes when nothing is missing, a copy is saved and the sheet is printed.
* Prints the inventory and the family guide on two pages, in Arabic or English.
* Saves a copy encrypted with a passphrase you choose (AES-256-GCM, PBKDF2-SHA-256, 600,000 rounds).
* Opens with no connection after the first visit, and can be added to a phone's home screen.

## What it does not do

* It never asks for a password, a code, a recovery phrase or a card number. The inventory has no field for one, and the page warns when typed text looks like one.
* It sends nothing to any server. No account, no tracking, no ads. The page's content security policy forbids every connection.
* It gives no religious ruling and divides no estate. Anything with money value goes to a qualified adviser.

## Pages

`docs/index.html` is the front page. Every picture on it is the tool itself, drawn live from a sample inventory. `docs/app.html` is the tool.

## How the promises are held

Tests fail the build when: the two languages differ in keys, an Arabic sentence carries a period before its end, the page code names a network call, the inventory gains a field that could hold a secret, a service entry lacks its official source, the offline copy is out of date, or a colour or duration appears outside the design tokens. `scripts/ui.mjs` walks the page in a real browser in both languages on a desktop and a phone.

## Sources

Service routes were read on 11 November 2026. Each entry in `docs/assets/js/engine/catalog.js` carries a level: `read` (the official page was read), `link` (the page exists but could not be read by the build, so the entry says only what its title states) or `advice` (general practice, no single source). Providers change these routes, so the page asks the reader to check the source.

## Licence

MIT for the code. Fonts are under the SIL Open Font License, see `THIRD_PARTY_NOTICES.md`.

Made by Ali AlEnezi.
