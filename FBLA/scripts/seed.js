const fs = require('fs');
const path = require('path');
const { getDatabase } = require('../config/database');

const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');

async function seedDatabase() {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        const seedSQL = fs.readFileSync(seedPath, 'utf8');

        db.exec(seedSQL, (err) => {
            if (err) {
                console.error('Error seeding database:', err.message);
                reject(err);
            } else {
                console.log('Database seeded successfully');
                resolve();
            }
            db.close();
        });
    });
}

seedDatabase()
    .then(() => {
        console.log('Seed complete');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Seed failed:', err);
        process.exit(1);
    });
