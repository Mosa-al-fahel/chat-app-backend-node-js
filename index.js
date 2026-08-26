const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 
const Message = require('./models/messageModel'); // استيراد موديل الرسائل

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const friendRoutes = require('./routes/friendRoutes');
// 1. أضف هذا السطر في الأعلى مع باقي الـ require
const messageRoutes = require('./routes/messageRoutes');

// 2. أضف هذا السطر تحت app.use('/api/friends', ...)

const app = express();
const server = http.createServer(app); 

// إعداد Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", 
    }
});

app.use(express.json());
app.use(cors());

io.on('connection', (socket) => {
    console.log('مستخدم جديد اتصل:', socket.id);

     socket.on('join', (userId) => {
        socket.join(userId);     
        console.log(`المستخدم ${userId} انضم لغرفته`);
    });

     socket.on('sendMessage', async (data) => {
        const { senderId, receiverId, text } = data;

        try {
             const newMessage = new Message({ senderId, receiverId, text });
            await newMessage.save();
            io.to(receiverId).emit('receiveMessage', { 
    _id: newMessage._id,  
    senderId,
     receiverId, 
    text, 
    createdAt: newMessage.createdAt 
});

io.to(senderId).emit('receiveMessage', { 
    _id: newMessage._id,
    receiverId,
    senderId, 
    text, 
    createdAt: newMessage.createdAt 
});

            
            
        } catch (error) {
            console.error("خطأ:", error);
        }
    });

    socket.on('typing', (data) => {
     
    const { receiverId, senderId,isTyping } = data;     

    if (receiverId && senderId) {
         socket.to(receiverId).emit('userTyping', { 
            senderId: senderId, 
            isTyping: isTyping 
        });
    }
});

    socket.on('disconnect', () => {        console.log('مستخدم غادر');
    });

}
);

// المسارات الأصلية
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);


// الاتصال بـ MongoDB
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => console.log("تم الاتصال بـ MongoDB بنجاح"))
.catch((err) => console.log("خطأ في الاتصال:", err.message));

app.get('/', (req, res) => res.send('Backend is running!'));

const port = process.env.PORT || 8001;
const host = '0.0.0.0';

// تشغيل السيرفر الموحد
server.listen(port, host, () => {
    console.log(`الخادم يعمل الآن مع Socket.io على المنفذ: ${port}`);
});