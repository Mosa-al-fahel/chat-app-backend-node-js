const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 
const Message = require('./models/messageModel'); 
dotenv.config();
const authRoutes = require('./routes/authRoutes');
const friendRoutes = require('./routes/friendRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { sendPushNotification } =   require('./services/notificationService');
const User = require('./models/User');  
const userRoutes = require('./routes/userRoutes');


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
    console.log('>>sokect successfully connected', socket.id);

     socket.on('join', (userId) => {
        socket.join(userId);     
        console.log(`the user ${userId} has been joined to room`);
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
     const receiver = await User.findById(receiverId);
     const sender = await User.findById(senderId);
if (receiver && receiver.fcmToken) {
                await sendPushNotification({
                    recipientFcmToken: receiver.fcmToken,
                    senderName: sender ? sender.username : 'رسالة جديدة',
                    messageText: text,
                    senderId: senderId,
                });
            }
     
        } catch (error) {
            console.error("Error while i am sending the message:", error);
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

    socket.on('disconnect', () => { console.log("user left the the room");
    });

}
);

// المسارات الأصلية
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', userRoutes);


// الاتصال بـ MongoDB
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
.then(() => console.log("connected Succesfully to MONGO DB"))
.catch((err) => console.log("some thing went wrong while making connection to MONGO DB ;( :", err.message));

app.get('/', (req, res) => res.send('Backend is running!'));

const port = process.env.PORT || 8001;
const host = '0.0.0.0';

// تشغيل السيرفر الموحد
server.listen(port, host, () => {
    console.log(`socket is working on the port :  ${port}`);
});