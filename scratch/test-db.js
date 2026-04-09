const mongoose = require('mongoose');
const fs = require('fs');

async function testConnection() {
  let uri;
  try {
    const env = fs.readFileSync('.env', 'utf8');
    uri = env.match(/^MONGODB_URI=(.+)/m)?.[1];
  } catch (e) {
    console.error('Could not read .env file');
  }
  
  console.log('Testing connection to:', uri ? uri.split('@')[1] || 'Local DB' : 'MISSING URI');
  
  if (!uri) {
    console.error('Error: MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('✅ SUCCESS: Connected to MongoDB successfully!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ FAILURE: Could not connect to MongoDB.');
    console.error('Error details:', err.message);
    process.exit(1);
  }
}

testConnection();
