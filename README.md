# خدمة إشعارات الفنادق

خدمة بسيطة لإرسال إشعارات FCM (Firebase Cloud Messaging) للتطبيقات المتعلقة بإدارة الفنادق. تستخدم هذه الخدمة Express.js و Firebase Admin SDK لإرسال إشعارات إلى أجهزة المستخدمين.

## المميزات

- إرسال إشعارات إلى موضوعات (topics) محددة لكل فندق
- اشتراك الأجهزة في موضوعات معينة
- إلغاء اشتراك الأجهزة من الموضوعات
- إرسال إشعارات مباشرة إلى أجهزة محددة
- دعم قنوات الإشعارات المختلفة
- تجنب تكرار الإشعارات باستخدام نظام التخزين المؤقت

## المتطلبات

- Node.js (الإصدار 14 أو أحدث)
- حساب Firebase مع تمكين Cloud Messaging
- ملف بيانات اعتماد Firebase (firebase-credentials.json)

## التثبيت

1. انسخ المشروع:

```bash
git clone https://github.com/your-username/hotel-notification-service.git
cd hotel-notification-service
```

2. قم بتثبيت التبعيات:

```bash
npm install
```

3. قم بإنشاء ملف `.env` من النموذج:

```bash
cp .env.example .env
```

4. قم بتعديل ملف `.env` وإضافة بيانات اعتماد Firebase الخاصة بك.

## التشغيل

### تشغيل الخدمة محلياً

```bash
npm start
```

### تشغيل الخدمة في وضع التطوير

```bash
npm run dev
```

## واجهة برمجة التطبيقات (API)

### إرسال إشعار إلى موضوع

```
POST /send-notification
```

المعلمات:
- `topic`: اسم الموضوع (مثل: `hotel_123`)
- `title`: عنوان الإشعار
- `body`: نص الإشعار
- `data` (اختياري): بيانات إضافية للإشعار
- `channelId` (اختياري): معرف قناة الإشعار (الافتراضي: `hotel_bookings_channel`)

### اشتراك جهاز في موضوع

```
POST /subscribe
```

المعلمات:
- `token`: رمز FCM للجهاز
- `topic`: اسم الموضوع للاشتراك فيه

### إلغاء اشتراك جهاز من موضوع

```
POST /unsubscribe
```

المعلمات:
- `token`: رمز FCM للجهاز
- `topic`: اسم الموضوع لإلغاء الاشتراك منه

### إرسال إشعار إلى جهاز محدد

```
POST /send-to-device
```

المعلمات:
- `token`: رمز FCM للجهاز
- `title`: عنوان الإشعار
- `body`: نص الإشعار
- `data` (اختياري): بيانات إضافية للإشعار
- `channelId` (اختياري): معرف قناة الإشعار (الافتراضي: `hotel_bookings_channel`)

## النشر على Render

1. قم بإنشاء خدمة ويب جديدة على Render
2. اربط بمستودع Git الخاص بك
3. قم بضبط الإعدادات التالية:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. أضف المتغيرات البيئية:
   - `PORT`: 10000 (أو أي منفذ آخر تفضله)
   - `FIREBASE_CREDENTIALS`: بيانات اعتماد Firebase الخاصة بك (كسلسلة JSON)

## النشر على Glitch

1. قم بإنشاء مشروع جديد على Glitch.com
2. يمكنك استيراد المشروع من GitHub أو رفع الملفات مباشرة
3. تأكد من وجود ملف `.env` مع المتغيرات البيئية التالية:
   - `PORT`: 3000 (Glitch يستخدم هذا المنفذ تلقائيًا)
   - `FIREBASE_CREDENTIALS`: بيانات اعتماد Firebase الخاصة بك (كسلسلة JSON)
4. بعد النشر، سيكون عنوان الخدمة الخاص بك: `https://your-project-name.glitch.me`
5. تأكد من تحديث `NOTIFICATION_SERVICE_URL` في تطبيق Flutter الخاص بك

### ملاحظات هامة عند استخدام Glitch

- Glitch يدخل في وضع السكون بعد 5 دقائق من عدم النشاط
- يمكنك استخدام خدمة مثل UptimeRobot للحفاظ على الخدمة نشطة
- تأكد من تحديث بيانات اعتماد Firebase في ملف `.env` وليس في الكود مباشرة
- يمكنك مراقبة سجلات الخدمة من خلال واجهة Glitch

## استخدام الخدمة مع تطبيق Flutter

يمكن استخدام هذه الخدمة مع تطبيق Flutter عن طريق:

1. تسجيل رمز FCM للجهاز في الموضوع الخاص بالفندق
2. إرسال طلبات HTTP إلى الخدمة عند الحاجة لإرسال إشعارات

مثال:

```dart
Future<void> subscribeToHotelTopic(String hotelId) async {
  final String token = await FirebaseMessaging.instance.getToken();
  final String topic = 'hotel_$hotelId';
  
  final response = await http.post(
    Uri.parse('https://your-project-name.glitch.me/subscribe'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'token': token,
      'topic': topic
    }),
  );
  
  if (response.statusCode == 200) {
    print('تم الاشتراك في موضوع الفندق بنجاح');
  } else {
    print('فشل في الاشتراك في موضوع الفندق');
  }
}
```

## الترخيص

MIT 