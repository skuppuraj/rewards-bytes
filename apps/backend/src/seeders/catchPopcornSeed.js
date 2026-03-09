/**
 * Run once to seed the Catch the Popcorn game into the DB:
 * node src/seeders/catchPopcornSeed.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const GameSchema = new mongoose.Schema({}, { strict: false });
const Game = mongoose.model('Game', GameSchema, 'games');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await Game.findOne({ key: 'catch_popcorn' });
  if (existing) {
    console.log('catch_popcorn already seeded.');
    process.exit(0);
  }

  await Game.create({
    key: 'catch_popcorn',
    name: 'Catch the Popcorn',
    shortDescription: 'Drag the bucket to catch falling popcorn and win rewards!',
    fullDescription: 'A fun arcade-style mobile game! Popcorn pieces fall from the top of the screen. Drag your bucket left and right to catch as many as possible before the timer runs out. Catch golden popcorn for bonus points, but avoid the burnt ones! Score 10+ popcorns to win a reward.',
    imageUrl: null,
    videoDemoUrl: null,
    rules: [
      'Drag the bucket left and right to catch falling popcorn.',
      'Normal popcorn: +1 point. Golden popcorn: +3 points. Burnt popcorn: -1 point.',
      'Catch at least 10 popcorns to win a reward.',
      'Game lasts 20 seconds. Speed increases after 10 seconds!',
    ],
    isActive: true,
    sortOrder: 3,
  });

  console.log('✅ catch_popcorn seeded!');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
