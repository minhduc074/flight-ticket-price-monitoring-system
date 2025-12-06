require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database URL for Prisma (set in .env as DATABASE_URL)
  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  },
  
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@flyticket.com',
    password: process.env.ADMIN_PASSWORD || 'admin123456'
  },
  
  // Vietnam airports
  airports: {
    'SGN': { name: 'Tân Sơn Nhất', city: 'Hồ Chí Minh' },
    'HAN': { name: 'Nội Bài', city: 'Hà Nội' },
    'DAD': { name: 'Đà Nẵng', city: 'Đà Nẵng' },
    'CXR': { name: 'Cam Ranh', city: 'Nha Trang' },
    'PQC': { name: 'Phú Quốc', city: 'Phú Quốc' },
    'VCA': { name: 'Cần Thơ', city: 'Cần Thơ' },
    'HPH': { name: 'Cát Bi', city: 'Hải Phòng' },
    'VII': { name: 'Vinh', city: 'Vinh' },
    'HUI': { name: 'Phú Bài', city: 'Huế' },
    'UIH': { name: 'Phù Cát', city: 'Quy Nhơn' },
    'VDO': { name: 'Vân Đồn', city: 'Quảng Ninh' },
    'DLI': { name: 'Liên Khương', city: 'Đà Lạt' },
    'BMV': { name: 'Buôn Ma Thuột', city: 'Buôn Ma Thuột' },
    'VCS': { name: 'Côn Đảo', city: 'Côn Đảo' },
    'PXU': { name: 'Pleiku', city: 'Pleiku' },
    'TBB': { name: 'Tuy Hòa', city: 'Tuy Hòa' },
    'VCL': { name: 'Chu Lai', city: 'Quảng Nam' },
    'VKG': { name: 'Rạch Giá', city: 'Rạch Giá' },
    'CAH': { name: 'Cà Mau', city: 'Cà Mau' },
    'THD': { name: 'Thọ Xuân', city: 'Thanh Hóa' },
    'VDH': { name: 'Đồng Hới', city: 'Quảng Bình' }
  }
};
