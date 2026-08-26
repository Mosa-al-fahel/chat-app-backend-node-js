const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // جلب التوكن من الـ Header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            status: "fail",
            message: "Unauthorized. Access token is missing or invalid." 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        // التحقق من التوكن
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'YOUR_JWT_SECRET');
        
        // تثبيت وتوحيد المعرف كـ id داخل الـ req لجميع دالات التطبيق
        req.user = { id: decoded.id };
        
        next();
    } catch (error) {
        return res.status(401).json({ 
            status: "fail",
            message: "Unauthorized. Token has expired or is invalid." 
        });
    }
};

module.exports = authMiddleware;