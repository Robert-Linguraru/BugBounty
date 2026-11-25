import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';

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

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});