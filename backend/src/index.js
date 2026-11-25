import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { verifyToken, requireRole } from './middleware/authMiddleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'BugBounty API is healthy' });
});

app.get('/api/admin/verify', verifyToken, requireRole('ADMIN'), (req, res) => {
  res.status(200).json({
    message: 'Admin access granted',
    user: req.user,
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});