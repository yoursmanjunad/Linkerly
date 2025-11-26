

const API_URL = 'http://localhost:5000/api';
const BASE_URL = 'http://localhost:5000';

async function runTest() {
  try {
    console.log('--- Starting Password Creation Debug Test ---');

    // 1. Register/Login User
    const email = `test_${Date.now()}@example.com`;
    const password = 'password123';
    
    console.log(`1. Registering user: ${email}`);
    let res = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser', email, password })
    });
    
    let text = await res.text();
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Registration JSON Error:', text.substring(0, 200));
      throw e;
    }
    let token = data.token;
    
    if (!token) {
      // Try login if exists
      console.log('User might exist, logging in...');
      res = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      data = await res.json();
      token = data.token;
    }

    if (!token) throw new Error('Failed to get token');
    console.log('Token acquired.');

    // 2. Create Password Protected URL
    const longUrl = 'https://example.com';
    const urlPassword = 'secret_pass';
    
    console.log('2. Creating password-protected URL...');
    res = await fetch(`${API_URL}/urls/shorten`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        longUrl,
        password: urlPassword // Sending password!
      })
    });
    
    const text2 = await res.text();
    try {
      data = JSON.parse(text2);
    } catch (e) {
      console.error('Failed to parse JSON:', text2.substring(0, 200));
      throw new Error('Invalid JSON response');
    }
    if (!data.success) throw new Error(`Creation failed: ${data.message}`);
    
    const shortUrl = data.data.shortUrl;
    console.log(`URL Created: ${shortUrl}`);

    // 3. Verify Redirect Logic (Simulate Browser)
    console.log(`3. Accessing ${BASE_URL}/${shortUrl} (No Password)...`);
    res = await fetch(`${BASE_URL}/${shortUrl}`, {
      redirect: 'manual' // Don't follow redirects automatically
    });
    
    console.log(`Response Status: ${res.status}`);
    console.log(`Location Header: ${res.headers.get('location')}`);
    
    if (res.status === 302 || res.status === 301) {
      const location = res.headers.get('location');
      if (location.includes('/password')) {
        console.log('✅ SUCCESS: Redirected to password page.');
      } else {
        console.log('❌ FAILURE: Redirected to wrong location (likely long URL).');
      }
    } else {
      console.log('❌ FAILURE: Did not redirect.');
      const text = await res.text();
      console.log('Response body:', text);
    }

  } catch (err) {
    console.error('❌ TEST ERROR:', err);
  }
}

runTest();
