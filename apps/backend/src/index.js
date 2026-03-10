const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Auth
app.use('/api/auth',       require('./routes/auth.routes'));

// Super Admin
app.use('/api/superadmin', require('./routes/superadmin.routes'));

// Org Admin
app.use('/api/offers',       require('./routes/offer.routes'));
app.use('/api/games',        require('./routes/game.routes'));
app.use('/api/coupons',      require('./routes/coupon.routes'));
app.use('/api/customers',    require('./routes/customer.routes'));
app.use('/api/game-history', require('./routes/gameHistory.routes'));
app.use('/api/feedback',     require('./routes/feedback.routes'));
app.use('/api/staff',        require('./routes/staff.routes'));
app.use('/api/org-settings', require('./routes/orgSettings.routes'));
app.use('/api/dashboard',    require('./routes/dashboard.routes'));

// Customer-facing
app.use('/api/public', require('./routes/public.routes'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch(err => console.error(err));
