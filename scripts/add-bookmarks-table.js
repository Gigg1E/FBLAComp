const { getDatabase } = require('../config/database');

async function addBookmarksTable() {
    return new Promise((resolve, reject) => {
        const db = getDatabase();

        db.serialize(() => {
            // Create bookmarks table
            db.run(`
                CREATE TABLE IF NOT EXISTS bookmarks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    business_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE(business_id, user_id)
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating bookmarks table:', err.message);
                    db.close();
                    return reject(err);
                }
                console.log('Bookmarks table created or already exists');
            });

            // Create indexes
            db.run('CREATE INDEX IF NOT EXISTS idx_bookmarks_business ON bookmarks(business_id)', (err) => {
                if (err) {
                    console.error('Error creating business index:', err.message);
                } else {
                    console.log('Business index created');
                }
            });

            db.run('CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id)', (err) => {
                if (err) {
                    console.error('Error creating user index:', err.message);
                } else {
                    console.log('User index created');
                }
                db.close();
                resolve();
            });
        });
    });
}

addBookmarksTable()
    .then(() => {
        console.log('Bookmarks migration complete');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Migration failed:', err);
        process.exit(1);
    });
