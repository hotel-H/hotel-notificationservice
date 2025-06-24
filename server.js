const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// تحميل المتغيرات البيئية
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ضبط CORS للسماح بالوصول من أي مصدر (يمكن تقييده لاحقاً)
app.use(cors());
app.use(bodyParser.json());

// تهيئة Firebase Admin SDK
// يمكن استخدام بيانات الاعتماد من المتغيرات البيئية أو من ملف
try {
  // الطريقة 1: استخدام بيانات الاعتماد من المتغيرات البيئية
  if (process.env.FIREBASE_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS))
    });
  } 
  // الطريقة 2: استخدام بيانات الاعتماد من ملف (للتطوير المحلي)
  else {
    const serviceAccount = require('./firebase-credentials.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  console.log('✅ تم تهيئة Firebase Admin SDK بنجاح');
} catch (error) {
  console.error('❌ خطأ في تهيئة Firebase Admin SDK:', error);
}

// طريق الصفحة الرئيسية
app.get('/', (req, res) => {
  res.send({
    status: 'online',
    service: 'Hotel Notification Service',
    version: '1.0.0',
    endpoints: [
      { path: '/send-notification', method: 'POST', description: 'إرسال إشعار إلى موضوع معين' },
      { path: '/subscribe', method: 'POST', description: 'اشتراك جهاز في موضوع معين' },
      { path: '/health', method: 'GET', description: 'التحقق من حالة الخدمة' }
    ]
  });
});

// طريق للتحقق من حالة الخدمة
app.get('/health', (req, res) => {
  res.send({ status: 'healthy', timestamp: new Date().toISOString() });
});

// طريق لإرسال إشعار إلى موضوع معين
app.post('/send-notification', async (req, res) => {
  try {
    const { topic, title, body, data = {}, channelId = 'hotel_bookings_channel' } = req.body;
    
    if (!topic || !title || !body) {
      return res.status(400).send({ 
        success: false, 
        error: 'يجب توفير topic و title و body' 
      });
    }
    
    console.log(`📤 إرسال إشعار إلى الموضوع: ${topic}`);
    console.log(`📝 العنوان: ${title}`);
    console.log(`📝 المحتوى: ${body}`);
    console.log(`🔔 قناة الإشعار: ${channelId}`);
    
    // إضافة معرف القناة إلى البيانات
    const notificationData = {
      ...data,
      channelId,
      timestamp: new Date().toISOString()
    };
    
    // إرسال الإشعار
    const message = {
      notification: {
        title,
        body
      },
      data: notificationData,
      android: {
        notification: {
          sound: 'default',
          channelId,
          priority: 'high'
        }
      },
      topic
    };
    
    const response = await admin.messaging().send(message);
    console.log(`✅ تم إرسال الإشعار بنجاح: ${response}`);
    
    res.status(200).send({
      success: true,
      messageId: response,
      topic,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ خطأ في إرسال الإشعار:`, error);
    res.status(500).send({
      success: false,
      error: error.message
    });
  }
});

// طريق للاشتراك في موضوع معين
app.post('/subscribe', async (req, res) => {
  try {
    const { token, topic } = req.body;
    
    if (!token || !topic) {
      return res.status(400).send({ 
        success: false, 
        error: 'يجب توفير token و topic' 
      });
    }
    
    console.log(`📲 اشتراك الجهاز في الموضوع: ${topic}`);
    console.log(`🔑 الرمز: ${token.substring(0, 10)}...${token.substring(token.length - 5)}`);
    
    // اشتراك الجهاز في الموضوع
    await admin.messaging().subscribeToTopic(token, topic);
    console.log(`✅ تم الاشتراك بنجاح في الموضوع: ${topic}`);
    
    res.status(200).send({
      success: true,
      topic,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ خطأ في الاشتراك في الموضوع:`, error);
    res.status(500).send({
      success: false,
      error: error.message
    });
  }
});

// طريق لإلغاء الاشتراك من موضوع معين
app.post('/unsubscribe', async (req, res) => {
  try {
    const { token, topic } = req.body;
    
    if (!token || !topic) {
      return res.status(400).send({ 
        success: false, 
        error: 'يجب توفير token و topic' 
      });
    }
    
    console.log(`📴 إلغاء اشتراك الجهاز من الموضوع: ${topic}`);
    
    // إلغاء اشتراك الجهاز من الموضوع
    await admin.messaging().unsubscribeFromTopic(token, topic);
    console.log(`✅ تم إلغاء الاشتراك بنجاح من الموضوع: ${topic}`);
    
    res.status(200).send({
      success: true,
      topic,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ خطأ في إلغاء الاشتراك من الموضوع:`, error);
    res.status(500).send({
      success: false,
      error: error.message
    });
  }
});

// طريق لإرسال إشعار إلى جهاز محدد
app.post('/send-to-device', async (req, res) => {
  try {
    const { token, title, body, data = {}, channelId = 'hotel_bookings_channel' } = req.body;
    
    if (!token || !title || !body) {
      return res.status(400).send({ 
        success: false, 
        error: 'يجب توفير token و title و body' 
      });
    }
    
    console.log(`📤 إرسال إشعار إلى الجهاز: ${token.substring(0, 10)}...`);
    
    // إرسال الإشعار
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        channelId,
        timestamp: new Date().toISOString()
      },
      android: {
        notification: {
          sound: 'default',
          channelId,
          priority: 'high'
        }
      },
      token
    };
    
    const response = await admin.messaging().send(message);
    console.log(`✅ تم إرسال الإشعار بنجاح: ${response}`);
    
    res.status(200).send({
      success: true,
      messageId: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`❌ خطأ في إرسال الإشعار إلى الجهاز:`, error);
    res.status(500).send({
      success: false,
      error: error.message
    });
  }
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`🚀 خدمة الإشعارات تعمل على المنفذ ${PORT}`);
}); 