const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

const log = (message, color = 'white') => {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bright: '\x1b[1m'
  };
  console.log(`${colors[color] || colors.white}${message}\x1b[0m`);
};

async function testDeleteAccountAPI() {
  log('🚀 Testing Delete Account API', 'bright');
  
  try {
    // Test 1: Valid delete account request
    log('\n📝 Test 1: Valid delete account request', 'cyan');
    const validRequest = {
      phoneNumber: '1234567890',
      password: 'password123',
      reason: 'Testing delete account functionality'
    };

    try {
      const response = await axios.post(`${BASE_URL}/auth/delete-account-request`, validRequest);
      log('✅ Valid request response:', 'green');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      log('❌ Valid request failed:', 'red');
      console.log(error.response?.data || error.message);
    }

    // Test 2: Invalid phone number
    log('\n📝 Test 2: Invalid phone number', 'cyan');
    const invalidPhoneRequest = {
      phoneNumber: '123',
      password: 'password123',
      reason: 'Testing with invalid phone'
    };

    try {
      const response = await axios.post(`${BASE_URL}/auth/delete-account-request`, invalidPhoneRequest);
      log('✅ Invalid phone response:', 'green');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      log('❌ Invalid phone request failed:', 'red');
      console.log(error.response?.data || error.message);
    }

    // Test 3: Missing password
    log('\n📝 Test 3: Missing password', 'cyan');
    const missingPasswordRequest = {
      phoneNumber: '1234567890',
      reason: 'Testing without password'
    };

    try {
      const response = await axios.post(`${BASE_URL}/auth/delete-account-request`, missingPasswordRequest);
      log('✅ Missing password response:', 'green');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      log('❌ Missing password request failed:', 'red');
      console.log(error.response?.data || error.message);
    }

    // Test 4: Non-existent user
    log('\n📝 Test 4: Non-existent user', 'cyan');
    const nonExistentUserRequest = {
      phoneNumber: '9999999999',
      password: 'password123',
      reason: 'Testing with non-existent user'
    };

    try {
      const response = await axios.post(`${BASE_URL}/auth/delete-account-request`, nonExistentUserRequest);
      log('✅ Non-existent user response:', 'green');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      log('❌ Non-existent user request failed:', 'red');
      console.log(error.response?.data || error.message);
    }

    log('\n🎉 Delete Account API testing completed!', 'green');
    log('\n📋 Summary:', 'bright');
    log('   - API endpoint: POST /api/auth/delete-account-request', 'cyan');
    log('   - Required fields: phoneNumber, password', 'cyan');
    log('   - Optional field: reason', 'cyan');
    log('   - Phone number format: 10 digits', 'cyan');

  } catch (error) {
    log(`❌ Test failed: ${error.message}`, 'red');
  }
}

testDeleteAccountAPI().catch(error => {
  log(`❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});
