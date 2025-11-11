# 💬 ChatConnect - Professional Real-Time Chat Application

## 🌟 Overview

ChatConnect is a modern, professional full-stack chat application built with the MERN stack. It features Instagram-like user profiles, real-time messaging, group chats, and enterprise-level security.

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication with refresh tokens
- Bcrypt password hashing (10+ rounds)
- Rate limiting & brute force protection
- Helmet.js for HTTP headers security
- Input validation & sanitization
- XSS & MongoDB injection prevention
- CORS configuration
- Secure cookie handling

### 👤 User Features
- User registration & login
- Instagram-like user profiles
- Profile pictures & bio
- Online/offline status
- Last seen timestamp
- User search functionality

### 💬 Chat Features
- Real-time one-on-one messaging
- Group chat creation & management
- Message history
- Typing indicators
- Read receipts
- Message notifications
- Emoji support
- Image sharing

### 🎨 UI/UX
- Modern, responsive design
- Beautiful landing page
- Smooth animations
- Mobile-friendly interface
- Dark mode support
- Intuitive navigation

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Bcrypt** - Password hashing

### Frontend
- **React.js** - UI library
- **React Router** - Navigation
- **Context API** - State management
- **Socket.io-client** - Real-time updates
- **Axios** - HTTP requests
- **CSS3** - Styling

## 📁 Project Structure

```
chat/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── rateLimiter.js
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Message.js
│   │   └── Group.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── messages.js
│   │   └── groups.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── messageController.js
│   │   └── groupController.js
│   ├── utils/
│   │   ├── generateToken.js
│   │   └── uploadImage.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── Landing/
│   │   │   ├── Auth/
│   │   │   ├── Chat/
│   │   │   ├── Profile/
│   │   │   └── Group/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/codemanabhay/chat.git
cd chat
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Create `.env` file in backend folder:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/chatconnect
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_REFRESH_SECRET=your_refresh_secret_key_change_this
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

4. Start backend server:
```bash
npm start
# or for development with nodemon
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Install frontend dependencies:
```bash
cd frontend
npm install
```

2. Create `.env` file in frontend folder:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

3. Start frontend:
```bash
npm start
```

Frontend will run on `http://localhost:3000`

## 📖 Usage

1. **Register**: Create a new account with username, email, and password
2. **Login**: Sign in with your credentials
3. **Profile**: Set up your profile with picture and bio
4. **Search Users**: Find other users to chat with
5. **Start Chat**: Click on a user to start one-on-one chat
6. **Create Group**: Create group chats with multiple users
7. **Send Messages**: Send text messages and images in real-time

## 🔒 Security Features

- **Password Security**: Bcrypt hashing with salt rounds
- **Token Management**: JWT with access & refresh tokens
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Server-side validation for all inputs
- **XSS Protection**: Content sanitization
- **NoSQL Injection**: MongoDB sanitization
- **HTTPS Ready**: SSL/TLS support
- **Secure Headers**: Helmet.js configuration

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/search/:query` - Search users

### Messages
- `GET /api/messages/:userId` - Get messages with user
- `POST /api/messages` - Send message
- `DELETE /api/messages/:id` - Delete message

### Groups
- `GET /api/groups` - Get user's groups
- `POST /api/groups` - Create group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `POST /api/groups/:id/members` - Add member
- `DELETE /api/groups/:id/members/:userId` - Remove member

## 🎯 Environment Variables

### Backend
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### Frontend
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGO_URI in .env file
- For MongoDB Atlas, whitelist your IP

### CORS Error
- Verify CLIENT_URL in backend .env
- Check CORS configuration in server.js

### Socket Connection Error
- Ensure backend server is running
- Verify SOCKET_URL in frontend .env

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Abhay** - [codemanabhay](https://github.com/codemanabhay)

## 🙏 Acknowledgments

- Inspired by modern chat applications
- Built with love and dedication
- Thanks to the open-source community

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Contact: codemanabhay@github.com

---

⭐ **Star this repo if you find it helpful!** ⭐

Made with ❤️ by Abhay
