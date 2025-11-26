
// Using native fetch
// If global fetch fails, I'll use http. But v22 definitely has it.

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

async function runTest() {
  console.log('🚀 Starting Password Flow Test...');

  // 1. Register/Login a temp user
  const email = `test_${Date.now()}@example.com`;
  const password = 'password123';
  let token;

  try {
    console.log(`\n1. Registering user: ${email}`);
    const regRes = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: `user_${Date.now()}`, email, password })
    });
    const regData = await regRes.json();
    
    if (!regRes.ok) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    
    // Login to get token
    console.log('2. Logging in...');
    const loginRes = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    
    token = loginData.data.accessToken;
    console.log('✅ Logged in successfully');

    // 2. Create Password Protected URL
    const longUrl = 'https://www.google.com';
    const urlPassword = 'secret_link_pass';
    console.log(`\n3. Creating password protected URL for: ${longUrl}`);
    
    const createRes = await fetch(`${API_URL}/urls/shorten`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        longUrl,
        password: urlPassword,
        title: 'Test Password Link'
      })
    });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(`Creation failed: ${JSON.stringify(createData)}`);
    
    const shortCode = createData.data.shortUrl;
    console.log(`✅ Created Short URL: ${BASE_URL}/${shortCode}`);

    // 3. Test Access WITHOUT Password
    console.log('\n4. Testing access WITHOUT password...');
    const noPassRes = await fetch(`${BASE_URL}/${shortCode}`, {
      redirect: 'manual' // Don't follow redirects automatically
    });
    
    console.log(`   Status: ${noPassRes.status}`);
    console.log(`   Location Header: ${noPassRes.headers.get('location')}`);
    
    if (noPassRes.status === 302 && noPassRes.headers.get('location').includes('/password')) {
      console.log('✅ CORRECT: Redirected to password page');
    } else {
      console.error('❌ FAILED: Did not redirect to password page correctly');
    }

    // 4. Test Access WITH Password
    console.log('\n5. Testing access WITH password...');
    const withPassRes = await fetch(`${BASE_URL}/${shortCode}?password=${urlPassword}`, {
      redirect: 'manual'
    });
    
    console.log(`   Status: ${withPassRes.status}`);
    console.log(`   Location Header: ${withPassRes.headers.get('location')}`);

    if (withPassRes.status === 301 && withPassRes.headers.get('location') === longUrl) {
      console.log('✅ CORRECT: Redirected to long URL');
    } else {
      console.error('❌ FAILED: Did not redirect to long URL');
    }

  } catch (error) {
    console.error('❌ Test Failed:', error);
  }
}

runTest();
