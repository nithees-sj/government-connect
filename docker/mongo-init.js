// MongoDB initialization script
// Creates the application database and user

db = db.getSiblingDB('govconnect');

db.createUser({
  user: 'govconnect_app',
  pwd: 'govconnect_app_2024',
  roles: [
    { role: 'readWrite', db: 'govconnect' },
  ],
});

// Create initial collections with validation
db.createCollection('users');
db.createCollection('applications');
db.createCollection('departments');
db.createCollection('workflows');
db.createCollection('notifications');
db.createCollection('audit_events');

print('✅ GovConnect MongoDB initialized successfully');
