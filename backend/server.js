require('dotenv').config();
const connectDB = require('./src/config/db');
const createApp = require('./src/app');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`[server] Interview Readiness API running on http://localhost:${PORT}`);
  });
}

start();
