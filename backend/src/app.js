const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const skillRoutes = require('./routes/skillRoutes');
const metaRoutes = require('./routes/metaRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const patternRoutes = require('./routes/patternRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const readinessRoutes = require('./routes/readinessRoutes');
const progressRoutes = require('./routes/progressRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  // Render (and most cloud platforms) sit behind a reverse proxy.
  // Without this, Express sees HTTP instead of HTTPS → secure cookies are
  // never set and req.protocol is wrong.
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
      credentials: true, // allow the httpOnly cookie to be sent
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'API is running.' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/skills', skillRoutes);
  app.use('/api/meta', metaRoutes);
  app.use('/api/interviews', interviewRoutes);
  app.use('/api/patterns', patternRoutes);
  app.use('/api/recommendations', recommendationRoutes);
  app.use('/api/readiness', readinessRoutes);
  app.use('/api/progress', progressRoutes);
  app.use('/api/reports', reportRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
