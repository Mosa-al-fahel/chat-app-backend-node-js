const Message = require('../models/messageModel');

 exports.getMessages = async (req, res) => {
    try {
        const { senderId, receiverId } = req.params;
        const messages = await Message.find({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        }).sort({ createdAt: 1 });  
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: "Error fetching messages." });
    }
};