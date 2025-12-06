const jwt = require('jsonwebtoken');
const config = require('../config');
const { prisma } = require('../lib/prisma');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, config.jwt.secret);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        fcmToken: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found or inactive.' 
      });
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired.' 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Server error during authentication.' 
    });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. Admin only.' 
        });
      }
      next();
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error during admin authentication.' 
    });
  }
};

module.exports = { auth, adminAuth };
