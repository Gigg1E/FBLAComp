// Debug Script to View Database Content - seein.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'reviews.db');

// ANSI color codes for better readability
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    magenta: '\x1b[35m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
};

function printHeader(title) {
    const width = 80;
    const border = '='.repeat(width);
    console.log(`\n${colors.bright}${colors.cyan}${border}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${title.toUpperCase().padStart((width + title.length) / 2).padEnd(width)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${border}${colors.reset}\n`);
}

function printSubHeader(title) {
    console.log(`${colors.yellow}${colors.bright}\n--- ${title} ---${colors.reset}`);
}

function printRow(row, index) {
    console.log(`${colors.green}[${index + 1}]${colors.reset}`);
    for (const [key, value] of Object.entries(row)) {
        const displayValue = value === null ? colors.red + 'NULL' + colors.reset : value;
        console.log(`  ${colors.magenta}${key}:${colors.reset} ${displayValue}`);
    }
    console.log('');
}

function printTableInfo(tableName, rows) {
    printSubHeader(`${tableName} (${rows.length} rows)`);
    if (rows.length === 0) {
        console.log(`  ${colors.red}No data found${colors.reset}\n`);
    } else {
        rows.forEach((row, index) => printRow(row, index));
    }
}

async function getAllData() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                reject(err);
                return;
            }
        });

        const data = {};

        // Define all tables to query
        const tables = ['users', 'businesses', 'reviews', 'deals', 'sessions'];
        let completed = 0;

        tables.forEach(table => {
            db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
                if (err) {
                    console.error(`${colors.red}Error reading ${table}:${colors.reset}`, err.message);
                    data[table] = [];
                } else {
                    data[table] = rows;
                }

                completed++;
                if (completed === tables.length) {
                    // Also get the business_stats view
                    db.all('SELECT * FROM business_stats', [], (err, rows) => {
                        if (err) {
                            console.error(`${colors.red}Error reading business_stats:${colors.reset}`, err.message);
                            data['business_stats'] = [];
                        } else {
                            data['business_stats'] = rows;
                        }

                        db.close(() => {
                            resolve(data);
                        });
                    });
                }
            });
        });
    });
}

async function displayDatabase() {
    try {
        printHeader('Database Debug Viewer - reviews.db');

        console.log(`${colors.blue}Database Path:${colors.reset} ${dbPath}\n`);

        const data = await getAllData();

        // Display Users
        printTableInfo('USERS', data.users);

        // Display Businesses
        printTableInfo('BUSINESSES', data.businesses);

        // Display Reviews
        printTableInfo('REVIEWS', data.reviews);

        // Display Deals
        printTableInfo('DEALS', data.deals);

        // Display Sessions
        printTableInfo('SESSIONS', data.sessions);

        // Display Business Stats (View)
        printTableInfo('BUSINESS_STATS (View)', data.business_stats);

        // Summary
        printHeader('Summary');
        console.log(`${colors.green}Total Users:${colors.reset} ${data.users.length}`);
        console.log(`${colors.green}Total Businesses:${colors.reset} ${data.businesses.length}`);
        console.log(`${colors.green}Total Reviews:${colors.reset} ${data.reviews.length}`);
        console.log(`${colors.green}Total Deals:${colors.reset} ${data.deals.length}`);
        console.log(`${colors.green}Active Sessions:${colors.reset} ${data.sessions.length}`);
        console.log('');

    } catch (error) {
        console.error(`${colors.red}${colors.bright}Error:${colors.reset}`, error.message);
        process.exit(1);
    }
}

// Run the script
displayDatabase();
