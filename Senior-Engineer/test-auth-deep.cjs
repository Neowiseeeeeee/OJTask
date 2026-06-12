const http = require('http');

async function testAuthFlowDeep() {
  console.log('🔍 DEEP AUTHENTICATION INVESTIGATION...');
  
  // Test 1: Check if auth endpoint is working
  const loginData = JSON.stringify({
    username: 'supervisor1',
    password: 'password123'
  });
  
  const loginOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'connect.sid=test'
    }
  };

  const loginReq = http.request(loginOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Login response status:', res.statusCode);
      console.log('Login response headers:', res.headers);
      console.log('Login response body:', data);
      
      if (res.statusCode === 200) {
        try {
          const loginResponse = JSON.parse(data);
          console.log('Login successful, user:', loginResponse.user);
          
          // Test 2: Check if session is set
          if (loginResponse.user && loginResponse.user.id) {
            console.log('✅ User authenticated, ID:', loginResponse.user.id);
            
            // Test 3: Check auth/me endpoint
            const meOptions = {
              hostname: 'localhost',
              port: 5000,
              path: '/api/auth/me',
              method: 'GET',
              headers: {
                'Cookie': res.headers['set-cookie'] || 'connect.sid=test'
              }
            };
            
            const meReq = http.request(meOptions, (meRes) => {
              let meData = '';
              meRes.on('data', (chunk) => {
                meData += chunk;
              });
              
              meRes.on('end', () => {
                console.log('Auth/me status:', meRes.statusCode);
                console.log('Auth/me body:', meData);
              });
            });
            
            meReq.end();
          }
        } catch (e) {
          console.error('Failed to parse login response:', e);
        }
      }
    });
  });

  loginReq.write(loginData);
  loginReq.end();
}

testAuthFlowDeep();
