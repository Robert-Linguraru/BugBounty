import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
<<<<<<< HEAD
import authRoutes from './routes/authRoutes.js';
=======
import { verifyToken, requireRole } from './middleware/authMiddleware.js';
>>>>>>> 3cd9641ac2a698c0ce895cd9729b554b7a5f22fe

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost',
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'BugBounty API is healthy' });
});

<<<<<<< HEAD
app.use('/api/auth', authRoutes);
=======
app.get('/api/admin/verify', verifyToken, requireRole('ADMIN'), (req, res) => {
  res.status(200).json({
    message: 'Admin access granted',
    user: req.user,
  });
});
>>>>>>> 3cd9641ac2a698c0ce895cd9729b554b7a5f22fe

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});