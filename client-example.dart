import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;

// عنوان خدمة الإشعارات على Render
const String NOTIFICATION_SERVICE_URL = 'https://your-service-name.onrender.com';

class NotificationService {
  // الحصول على رمز FCM وتسجيله في موضوع الفندق
  Future<void> registerDeviceForHotel(String hotelId) async {
    try {
      // الحصول على رمز FCM
      final String? token = await FirebaseMessaging.instance.getToken();
      
      if (token == null) {
        debugPrint('❌ فشل في الحصول على رمز FCM');
        return;
      }
      
      debugPrint('✅ تم الحصول على رمز FCM: $token');
      
      // إنشاء اسم الموضوع الخاص بالفندق
      final String topic = 'hotel_$hotelId';
      
      // تسجيل الجهاز في الموضوع
      await _subscribeToTopic(token, topic);
      
      // اشتراك محلي في الموضوع أيضًا
      await FirebaseMessaging.instance.subscribeToTopic(topic);
      
      debugPrint('✅ تم تسجيل الجهاز في موضوع الفندق: $topic');
    } catch (e) {
      debugPrint('❌ خطأ في تسجيل الجهاز: $e');
    }
  }
  
  // تسجيل الجهاز في موضوع معين عبر خدمة الإشعارات
  Future<bool> _subscribeToTopic(String token, String topic) async {
    try {
      final response = await http.post(
        Uri.parse('$NOTIFICATION_SERVICE_URL/subscribe'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'token': token,
          'topic': topic
        }),
      );
      
      if (response.statusCode == 200) {
        debugPrint('✅ تم الاشتراك في الموضوع بنجاح: $topic');
        return true;
      } else {
        debugPrint('❌ فشل في الاشتراك في الموضوع: ${response.body}');
        return false;
      }
    } catch (e) {
      debugPrint('❌ استثناء أثناء الاشتراك في الموضوع: $e');
      return false;
    }
  }
  
  // إرسال إشعار إلى موضوع معين (مثل: جميع أجهزة فندق معين)
  Future<bool> sendNotificationToHotel({
    required String hotelId,
    required String title,
    required String body,
    Map<String, dynamic>? data,
    String channelId = 'hotel_bookings_channel',
  }) async {
    try {
      final String topic = 'hotel_$hotelId';
      
      final response = await http.post(
        Uri.parse('$NOTIFICATION_SERVICE_URL/send-notification'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'topic': topic,
          'title': title,
          'body': body,
          'data': data ?? {},
          'channelId': channelId,
        }),
      );
      
      if (response.statusCode == 200) {
        debugPrint('✅ تم إرسال الإشعار بنجاح إلى الموضوع: $topic');
        return true;
      } else {
        debugPrint('❌ فشل في إرسال الإشعار: ${response.body}');
        return false;
      }
    } catch (e) {
      debugPrint('❌ استثناء أثناء إرسال الإشعار: $e');
      return false;
    }
  }
  
  // إرسال إشعار إلى جهاز محدد
  Future<bool> sendNotificationToDevice({
    required String token,
    required String title,
    required String body,
    Map<String, dynamic>? data,
    String channelId = 'hotel_bookings_channel',
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$NOTIFICATION_SERVICE_URL/send-to-device'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'token': token,
          'title': title,
          'body': body,
          'data': data ?? {},
          'channelId': channelId,
        }),
      );
      
      if (response.statusCode == 200) {
        debugPrint('✅ تم إرسال الإشعار بنجاح إلى الجهاز');
        return true;
      } else {
        debugPrint('❌ فشل في إرسال الإشعار: ${response.body}');
        return false;
      }
    } catch (e) {
      debugPrint('❌ استثناء أثناء إرسال الإشعار: $e');
      return false;
    }
  }
  
  // تهيئة خدمة الإشعارات
  Future<void> initialize() async {
    try {
      // طلب أذونات الإشعارات
      final settings = await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      
      debugPrint('🔔 حالة أذونات الإشعارات: ${settings.authorizationStatus}');
      
      // تسجيل معالج الإشعارات في الخلفية
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
      
      // تسجيل معالج الإشعارات في المقدمة
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('📩 تم استلام إشعار في المقدمة:');
        debugPrint('📩 العنوان: ${message.notification?.title}');
        debugPrint('📩 المحتوى: ${message.notification?.body}');
        debugPrint('📩 البيانات: ${message.data}');
        
        // يمكنك هنا عرض إشعار محلي باستخدام awesome_notifications
        // حتى عندما يكون التطبيق مفتوحًا
      });
      
      // معالجة النقر على الإشعار عندما يكون التطبيق في الخلفية
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('🔔 تم النقر على الإشعار:');
        debugPrint('🔔 العنوان: ${message.notification?.title}');
        debugPrint('🔔 المحتوى: ${message.notification?.body}');
        debugPrint('🔔 البيانات: ${message.data}');
        
        // يمكنك هنا التنقل إلى شاشة معينة بناءً على البيانات
      });
      
      debugPrint('✅ تم تهيئة خدمة الإشعارات بنجاح');
    } catch (e) {
      debugPrint('❌ خطأ في تهيئة خدمة الإشعارات: $e');
    }
  }
}

// معالج الإشعارات في الخلفية
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // يجب تهيئة Firebase قبل استخدامه في الخلفية
  debugPrint('📩 تم استلام إشعار في الخلفية:');
  debugPrint('📩 العنوان: ${message.notification?.title}');
  debugPrint('📩 المحتوى: ${message.notification?.body}');
  debugPrint('📩 البيانات: ${message.data}');
} 