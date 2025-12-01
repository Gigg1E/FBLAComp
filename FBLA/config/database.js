const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'reviews.db');
const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');

// Create database connection
function getDatabase() {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error connecting to database:', err.message);
        }
    });
    return db;
}

// Initialize database with schema
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        const schema = fs.readFileSync(schemaPath, 'utf8');

        db.exec(schema, (err) => {
            if (err) {
                console.error('Error initializing database:', err.message);
                reject(err);
            } else {
                console.log('Database initialized successfully');
                resolve();
            }
            db.close();
        });
    });
}

// Run database query with promise
function runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        db.run(query, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
            db.close();
        });
    });
}

// Get single row from database
function getOne(query, params = []) {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        db.get(query, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
            db.close();
        });
    });
}

// Get multiple rows from database
function getAll(query, params = []) {
    return new Promise((resolve, reject) => {
        const db = getDatabase();
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
            db.close();
        });
    });
}

// Clean up expired sessions
async function cleanupExpiredSessions() {
    try {
        await runQuery('DELETE FROM sessions WHERE expires_at < datetime("now")');
    } catch (err) {
        console.error('Error cleaning up sessions:', err.message);
    }
}

// If this file is run directly, initialize the database
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('Database setup complete');
            process.exit(0);
        })
        .catch((err) => {
            console.error('Database setup failed:', err);
            process.exit(1);
        });
}

module.exports = {
    getDatabase,
    initializeDatabase,
    runQuery,
    getOne,
    getAll,
    cleanupExpiredSessions
};
