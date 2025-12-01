const { getDatabase } = require('../config/database');

async function addProductsColumn() {
    return new Promise((resolve, reject) => {
        const db = getDatabase();

        db.run('ALTER TABLE businesses ADD COLUMN products TEXT', (err) => {
            if (err) {
                // Column might already exist
                if (err.message.includes('duplicate column name')) {
                    console.log('Products column already exists');
                    resolve();
                } else {
                    console.error('Error adding products column:', err.message);
                    reject(err);
                }
            } else {
                console.log('Products column added successfully');
                resolve();
            }
            db.close();
        });
    });
}

addProductsColumn()
    .then(() => {
        console.log('Migration complete');
        process.exit(0);
    })
    .catch((err) => {
        console.error('Migration failed:', err);
        process.exit(1);
    });
