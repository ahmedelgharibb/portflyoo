// API Test Functions - External JavaScript file to avoid CSP issues

// Utility function to show results
function showResult(elementId, type, title, content) {
    const element = document.getElementById(elementId);
    const statusClass = type === 'success' ? 'success' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info';
    element.innerHTML = `
        <div class="result ${statusClass}">
            <strong>${title}</strong>
            <span class="status ${statusClass}">${type.toUpperCase()}</span>
            ${content}
        </div>
    `;
}

// Test basic API connection
async function testBasicConnection() {
    const button = document.getElementById('testBasicBtn');
    button.disabled = true;
    button.textContent = 'Testing...';
    
    try {
        const response = await fetch('api.php?action=getData');
        const result = await response.json();
        
        showResult('basicResult', 'success', '✅ API Connection Successful', `
Status: ${response.status}
Response Time: ${Date.now()}ms
Data Keys: ${Object.keys(result).join(', ')}
Sample Data: ${JSON.stringify(result, null, 2).substring(0, 300)}...
        `);
    } catch (error) {
        showResult('basicResult', 'error', '❌ API Connection Failed', `
Error: ${error.message}
Time: ${new Date().toLocaleTimeString()}
        `);
    } finally {
        button.disabled = false;
        button.textContent = 'Test Connection';
    }
}

// Test login
async function testLogin() {
    const button = document.getElementById('testLoginBtn');
    const password = document.getElementById('loginPassword').value;
    
    button.disabled = true;
    button.textContent = 'Testing...';
    
    try {
        const response = await fetch('api.php?action=login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: password })
        });

        const result = await response.json();
        
        if (result.success) {
            showResult('loginResult', 'success', '✅ Login Successful', `
Status: ${response.status}
Message: ${result.message}
Time: ${new Date().toLocaleTimeString()}
            `);
        } else {
            showResult('loginResult', 'error', '❌ Login Failed', `
Status: ${response.status}
Message: ${result.message}
Time: ${new Date().toLocaleTimeString()}
            `);
        }
    } catch (error) {
        showResult('loginResult', 'error', '❌ Login Test Failed', `
Error: ${error.message}
Time: ${new Date().toLocaleTimeString()}
        `);
    } finally {
        button.disabled = false;
        button.textContent = 'Test Login';
    }
}

// Test GET password change
async function testPasswordChangeGET() {
    const button = document.getElementById('testGETBtn');
    const currentPassword = document.getElementById('currentPassGet').value;
    const newPassword = document.getElementById('newPassGet').value;
    
    button.disabled = true;
    button.textContent = 'Testing...';
    
    try {
        const params = new URLSearchParams({
            action: 'changePassword',
            currentPassword: currentPassword,
            newPassword: newPassword
        });
        
        const response = await fetch(`api.php?${params.toString()}`, {
            method: 'GET'
        });

        const responseText = await response.text();
        let result;
        
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            showResult('passwordChangeGETResult', 'error', '❌ JSON Parse Error', `
Status: ${response.status}
Response Text: ${responseText}
Parse Error: ${parseError.message}
Time: ${new Date().toLocaleTimeString()}
            `);
            return;
        }
        
        if (result.success) {
            showResult('passwordChangeGETResult', 'success', '✅ Password Change Successful', `
Status: ${response.status}
Message: ${result.message}
Method: GET with URL parameters
Time: ${new Date().toLocaleTimeString()}
            `);
        } else {
            showResult('passwordChangeGETResult', 'error', '❌ Password Change Failed', `
Status: ${response.status}
Message: ${result.message}
Time: ${new Date().toLocaleTimeString()}
            `);
        }
    } catch (error) {
        showResult('passwordChangeGETResult', 'error', '❌ GET Password Change Failed', `
Error: ${error.message}
Time: ${new Date().toLocaleTimeString()}
        `);
    } finally {
        button.disabled = false;
        button.textContent = 'Test GET Password Change';
    }
}

// Test JSON password change
async function testPasswordChangeJSON() {
    const button = document.getElementById('testJSONBtn');
    const currentPassword = document.getElementById('currentPass').value;
    const newPassword = document.getElementById('newPass').value;
    const resultDiv = document.getElementById('passwordChangeJSONResult');
    
    button.disabled = true;
    button.textContent = 'Testing...';
    
    try {
        console.log('Testing JSON password change...');
        const response = await fetch('api.php?action=changePassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            resultDiv.innerHTML = `
                <div class="error">
                    ❌ JSON parse error
                    Status: ${response.status}
                    Response text: ${responseText}
                    Parse error: ${parseError.message}
                </div>
            `;
            return;
        }
        
        resultDiv.innerHTML = `
            <div class="${result.success ? 'success' : 'error'}">
                ${result.success ? '✅' : '❌'} Password change ${result.success ? 'successful' : 'failed'}
                Status: ${response.status}
                Response: ${JSON.stringify(result, null, 2)}
            </div>
        `;
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="error">
                ❌ JSON password change test failed
                Error: ${error.message}
            </div>
        `;
    } finally {
        button.disabled = false;
        button.textContent = 'Test JSON Password Change';
    }
}

// Test form data password change
async function testPasswordChangeForm() {
    const button = document.getElementById('testFormBtn');
    const currentPassword = document.getElementById('currentPassForm').value;
    const newPassword = document.getElementById('newPassForm').value;
    const resultDiv = document.getElementById('passwordChangeFormResult');
    
    button.disabled = true;
    button.textContent = 'Testing...';
    
    try {
        console.log('Testing form data password change...');
        const formData = new FormData();
        formData.append('currentPassword', currentPassword);
        formData.append('newPassword', newPassword);
        
        const response = await fetch('api.php?action=changePassword', {
            method: 'POST',
            body: formData
        });

        console.log('Response status:', response.status);
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            resultDiv.innerHTML = `
                <div class="error">
                    ❌ JSON parse error
                    Status: ${response.status}
                    Response text: ${responseText}
                    Parse error: ${parseError.message}
                </div>
            `;
            return;
        }
        
        resultDiv.innerHTML = `
            <div class="${result.success ? 'success' : 'error'}">
                ${result.success ? '✅' : '❌'} Password change ${result.success ? 'successful' : 'failed'}
                Status: ${response.status}
                Response: ${JSON.stringify(result, null, 2)}
            </div>
        `;
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="error">
                ❌ Form data password change test failed
                Error: ${error.message}
            </div>
        `;
    } finally {
        button.disabled = false;
        button.textContent = 'Test Form Password Change';
    }
}

// Test get data
async function testGetData() {
    const button = document.getElementById('testGetDataBtn');
    
    button.disabled = true;
    button.textContent = 'Testing...';
    
    try {
        const response = await fetch('api.php?action=getData');
        const result = await response.json();
        
        showResult('getDataResult', 'success', '✅ Get Data Successful', `
Status: ${response.status}
Data Keys: ${Object.keys(result).join(', ')}
Data Size: ${JSON.stringify(result).length} characters
Sample Data: ${JSON.stringify(result, null, 2).substring(0, 400)}...
Time: ${new Date().toLocaleTimeString()}
        `);
    } catch (error) {
        showResult('getDataResult', 'error', '❌ Get Data Failed', `
Error: ${error.message}
Time: ${new Date().toLocaleTimeString()}
        `);
    } finally {
        button.disabled = false;
        button.textContent = 'Test Get Data';
    }
}

// Test POST request capability
async function testPOSTRequest() {
    const button = document.getElementById('testPOSTBtn');
    
    button.disabled = true;
    button.textContent = 'Testing...';
    
    try {
        const response = await fetch('api.php?action=changePassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currentPassword: 'test',
                newPassword: 'test'
            })
        });

        if (response.status === 405) {
            showResult('postTestResult', 'warning', '⚠️ POST Requests Blocked', `
Status: ${response.status} (Method Not Allowed)
Server Configuration: POST requests are blocked by server
Recommendation: Use GET requests for password changes
Time: ${new Date().toLocaleTimeString()}
            `);
        } else {
            showResult('postTestResult', 'success', '✅ POST Requests Allowed', `
Status: ${response.status}
Server Configuration: POST requests are allowed
Time: ${new Date().toLocaleTimeString()}
            `);
        }
    } catch (error) {
        showResult('postTestResult', 'error', '❌ POST Test Failed', `
Error: ${error.message}
Time: ${new Date().toLocaleTimeString()}
        `);
    } finally {
        button.disabled = false;
        button.textContent = 'Test POST Request';
    }
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for all test buttons
    const testBasicBtn = document.getElementById('testBasicBtn');
    const testLoginBtn = document.getElementById('testLoginBtn');
    const testJSONBtn = document.getElementById('testJSONBtn');
    const testGETBtn = document.getElementById('testGETBtn');
    const testFormBtn = document.getElementById('testFormBtn');
    const testGetDataBtn = document.getElementById('testGetDataBtn');
    const testPOSTBtn = document.getElementById('testPOSTBtn');
    
    if (testBasicBtn) testBasicBtn.addEventListener('click', testBasicConnection);
    if (testLoginBtn) testLoginBtn.addEventListener('click', testLogin);
    if (testJSONBtn) testJSONBtn.addEventListener('click', testPasswordChangeJSON);
    if (testGETBtn) testGETBtn.addEventListener('click', testPasswordChangeGET);
    if (testFormBtn) testFormBtn.addEventListener('click', testPasswordChangeForm);
    if (testGetDataBtn) testGetDataBtn.addEventListener('click', testGetData);
    if (testPOSTBtn) testPOSTBtn.addEventListener('click', testPOSTRequest);
    
    // Auto-run basic connection test if the button exists
    if (testBasicBtn) {
        setTimeout(testBasicConnection, 500);
    }
}); 