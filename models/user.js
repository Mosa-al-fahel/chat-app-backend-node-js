const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    // أنا أضفت هذا ليعمل تلقائياً بدون أن تمرره من بوست مان
    avatar: { 
        type: String, 
        default: "https://placeholder-avatar.png" 
    },
    fcmToken: { type: String, default: null },
    // وأضفت هذا لتجهيز الشات مستقبلاً دون أي تدخل منك الآن
    friends: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
    // هذا يضيف وقت إنشاء الحساب تلقائياً
    timestamps: true 
});

module.exports = mongoose.model('User', userSchema);