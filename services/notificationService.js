// services/notificationService.js
const admin = require('../config/firebase');
const { getMessaging } = require('firebase-admin/messaging');

async function sendPushNotification({ recipientFcmToken, senderName, messageText, senderId }) {
  if (!recipientFcmToken) return;

  const payload = {
    token: recipientFcmToken,
    notification: {
      title: senderName || 'notifications',
      body: messageText || 'message',
    },
    android: {
      priority: 'high', 
      notification: {
        sound: 'default',
        priority: 'high',
        defaultSound: true,
        defaultVibrateTimings: true,
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
    data: {
      _id: senderId ? senderId.toString() : '',
      username: senderName || '',
       type: 'CHAT_MESSAGE',
    },
  };

  try {
    const response = await getMessaging().send(payload);
    console.log('notifications pushed', response);
  } catch (error) {
    console.error('خطأ أثناء إرسال الإشعار عبر FCM:', error.message);
  }
}

module.exports = { sendPushNotification };