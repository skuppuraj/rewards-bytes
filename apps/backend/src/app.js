const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth',        require('./routes/auth.routes'));
app.use('/api/superadmin',  require('./routes/superadmin.routes'));
app.use('/api/games',       require('./routes/game.routes'));
app.use('/api/offers',      require('./routes/offer.routes'));
app.use('/api/coupons',     require('./routes/coupon.routes'));
app.use('/api/customers',   require('./routes/customer.routes'));
app.use('/api/dashboard',   require('./routes/dashboard.routes'));
app.use('/api/public',      require('./routes/public.routes'));
app.use('/api/org-settings',require('./routes/orgSettings.routes'));
app.use('/api/staff',       require('./routes/staff.routes'));
app.use('/api/player',      require('./routes/player.routes'));
app.use('/api/game-history',require('./routes/gameHistory.routes'));
app.use('/api/feedback',    require('./routes/feedback.routes'));

module.exports = app;
