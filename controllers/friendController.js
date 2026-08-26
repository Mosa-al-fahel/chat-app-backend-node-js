const User = require('../models/User'); 
const Message = require('../models/messageModel');

// 1. إرسال طلب صداقة أو قبول الصداقة مباشرة لتسهيل الشات
exports.sendFriendRequest = async (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.user.id;

        if (userId === friendId) {
            return res.status(400).json({ message: "You cannot add yourself." });
        }

        const friend = await User.findById(friendId);
        const currentUser = await User.findById(userId);

        // 1. التحقق إذا كانوا أصدقاء بالفعل
        if (currentUser.friends.includes(friendId)) {
            return res.status(400).json({ message: "Already friends." });
        }

        // 2. التحقق إذا كان الطلب مرسلاً مسبقاً
        if (friend.friendRequests.includes(userId)) {
            return res.status(400).json({ message: "Request already sent." });
        }

        // 3. إضافة الـ userId الخاص بالمرسل إلى قائمة طلبات المستقبل
        friend.friendRequests.push(userId);
        await friend.save();

        res.status(200).json({ message: "Friend request sent successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error sending request." });
    }
};

exports.getFriendRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        // نبحث عن المستخدم الحالي ونقوم بجلب تفاصيل المستخدمين الموجودين في قائمة الطلبات
        // .populate تعني: "بدل الـ ID، أعطني بيانات المستخدم (الاسم، الإيميل)"
        const user = await User.findById(userId).populate('friendRequests', 'username email');

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // نرسل قائمة الطلبات (التي أصبحت الآن تحتوي على بيانات المرسلين)
        res.status(200).json(user.friendRequests);
    } catch (error) {
        res.status(500).json({ message: "An error occurred while fetching requests." });
    }
};
exports.acceptFriendRequest = async (req, res) => {
    try {
        const { senderId } = req.body; // الشخص الذي أرسل الطلب
        const userId = req.user.id;    // الشخص الذي يستقبل (ويوافق)

        const currentUser = await User.findById(userId);
        const sender = await User.findById(senderId);

        // 1. التحقق من وجود الطلب في القائمة
        if (!currentUser.friendRequests.includes(senderId)) {
            return res.status(400).json({ message: "No request found from this user." });
        }

        // 2. إزالة الطلب من قائمة الطلبات
        currentUser.friendRequests = currentUser.friendRequests.filter(
            id => id.toString() !== senderId
        );

        // 3. إضافة كل طرف لقائمة أصدقاء الآخر
        currentUser.friends.push(senderId);
        sender.friends.push(userId);

        await currentUser.save();
        await sender.save();

        res.status(200).json({ message: "Friend request accepted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error accepting request." });
    }
};
exports.getFriendsList = async (req, res) => {
    try {
        const userId = req.user.id; 

        const user = await User.findById(userId).populate({
            path: 'friends',
            select: 'username email avatar' 
        });

        if (!user) {
            return res.status(404).json({ 
                status: false,
                message: "User profile is unavailable." 
            });
        }

        const friendsWithLastMessage = await Promise.all(
            user.friends.map(async (friend) => {
                
                const lastMessageObj = await Message.findOne({
                    $or: [
                        { senderId: userId, receiverId: friend._id },
                        { senderId: friend._id, receiverId: userId }
                    ]
                }).sort({ createdAt: -1 }); 

                return {
                    _id: friend._id,
                    username: friend.username,
                    email: friend.email,
                    avatar: friend.avatar,
                    lastMessage: lastMessageObj ? lastMessageObj.text : "Start a conversation",
                    lastMessageTime: lastMessageObj ? lastMessageObj.createdAt : null
                };
            })
        );

        friendsWithLastMessage.sort((a, b) => {
            if (!a.lastMessageTime) return 1;
            if (!b.lastMessageTime) return -1;
            return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
        });

        res.status(200).json(friendsWithLastMessage);

    } catch (error) {
        console.error(error); 
        res.status(500).json({ 
            status: "error",
            message: "An unexpected error occurred while fetching friends list. Please try again." 
        });
    }
};

// 2. جلب قائمة الأصدقاء مع تفاصيلهم (Populate) لتعرض في الفلاتر
// exports.getFriendsList = async (req, res) => {
//     try {
//         const userId = req.user.id; // ثابتة ومضمونة

//         const user = await User.findById(userId).populate({
//             path: 'friends',
//             select: 'username email avatar' 
//         });

//         if (!user) {
//             return res.status(404).json({ 
//                 status: false,
//                 message: "User profile is unavailable." 
//             });
//         }

//         res.status(200).json(user.friends);
//     } catch (error) {
//         res.status(500).json({ 
//             status: "error",
//             message: "An unexpected error occurred while fetching friends list. Please try again." 
//         });
//     }
// };

// 4. جلب جميع مستخدمي التطبيق (مع استبعاد المستخدم الحالي وأصدقائه الحاليين)
exports.getExploreUsers = async (req, res) => {
    try {
        const userId = req.user.id; // ثابتة ومضمونة

        const currentUser = await User.findById(userId);

        const users = await User.find({
            _id: { $ne: userId, $nin: currentUser.friends }
        }).select('username email avatar'); 

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ 
            status: false,
            message: "An unexpected error occurred while fetching explore users. Please try again." 
        });
    }
};

// 5. إزالة صديق من القائمة
exports.removeFriend = async (req, res) => {
    try {
        const { friendId } = req.body;
        const userId = req.user.id; // ثابتة ومضمونة
        
        const currentUser = await User.findById(userId);
        const friend = await User.findById(friendId);

        if (!currentUser || !friend) {
            return res.status(404).json({ 
                status: false,
                message: "User or friend profile could not be found." 
            });
        }

        if (!currentUser.friends.includes(friendId)) {
            return res.status(400).json({ 
                status: false,
                message: "This user is not in your friends list." 
            });
        }

        currentUser.friends = currentUser.friends.filter(id => id.toString() !== friendId);
        friend.friends = friend.friends.filter(id => id.toString() !== userId);

        await currentUser.save();
        await friend.save();

        res.status(200).json({ message: "Friend was removed successfully." });
    } catch (error) {
        res.status(500).json({ 
            status: false,
            message: "An unexpected error occurred while removing friend. Please try again." 
        });
    }
};