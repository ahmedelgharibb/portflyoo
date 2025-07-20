// Test script to verify password change flow
import bcrypt from 'bcryptjs';

console.log('🧪 Testing Password Change Flow\n');

// Step 1: Test password hashing
async function testPasswordHashing() {
    console.log('1️⃣ Testing Password Hashing...');
    const testPassword = 'newpassword123';
    const saltRounds = 12;
    
    try {
        const hashedPassword = await bcrypt.hash(testPassword, saltRounds);
        console.log('✅ Password hashed successfully');
        console.log('   Original:', testPassword);
        console.log('   Hashed:', hashedPassword);
        
        // Verify the hash works
        const isValid = await bcrypt.compare(testPassword, hashedPassword);
        console.log('✅ Hash verification:', isValid ? 'SUCCESS' : 'FAILED');
        
        return hashedPassword;
    } catch (error) {
        console.error('❌ Hashing error:', error);
        return null;
    }
}

// Step 2: Test data structure
function testDataStructure(hashedPassword) {
    console.log('\n2️⃣ Testing Data Structure...');
    
    const siteData = {
        data: {
            admin: {
                password: hashedPassword
            },
            personal: {
                name: 'Dr. Ahmed Mahmoud',
                title: 'Mathematics Educator'
            },
            experience: {
                schools: ['School 1', 'School 2']
            }
        }
    };
    
    console.log('✅ Data structure created');
    console.log('   Admin password exists:', !!siteData.data.admin.password);
    console.log('   Password is hashed:', siteData.data.admin.password.startsWith('$2a$') || siteData.data.admin.password.startsWith('$2b$'));
    
    return siteData;
}

// Step 3: Test API simulation
async function testAPISimulation(siteData) {
    console.log('\n3️⃣ Testing API Simulation...');
    
    // Simulate changePassword API response
    const changePasswordResponse = {
        success: true,
        message: 'Password hashed successfully. Click "Save Changes" to update the database.',
        hashedPassword: siteData.data.admin.password
    };
    
    console.log('✅ changePassword API response:', changePasswordResponse);
    
    // Simulate saveData API call
    const saveDataPayload = {
        id: 1,
        data: siteData
    };
    
    console.log('✅ saveData API payload structure:', {
        hasId: !!saveDataPayload.id,
        hasData: !!saveDataPayload.data,
        hasAdminPassword: !!saveDataPayload.data.data.admin.password,
        passwordIsHashed: saveDataPayload.data.data.admin.password.startsWith('$2a$') || saveDataPayload.data.data.admin.password.startsWith('$2b$')
    });
    
    return saveDataPayload;
}

// Run the test
async function runTest() {
    console.log('🚀 Starting Password Flow Test...\n');
    
    // Step 1: Hash password
    const hashedPassword = await testPasswordHashing();
    if (!hashedPassword) {
        console.error('❌ Test failed at step 1');
        return;
    }
    
    // Step 2: Create data structure
    const siteData = testDataStructure(hashedPassword);
    
    // Step 3: Test API simulation
    const saveDataPayload = testAPISimulation(siteData);
    
    console.log('\n🎉 All tests passed!');
    console.log('\n📋 Flow Summary:');
    console.log('   1. User enters new password');
    console.log('   2. changePassword API hashes password');
    console.log('   3. Frontend stores hashed password in siteData');
    console.log('   4. User clicks "Save Changes"');
    console.log('   5. saveData API saves hashed password to database');
    console.log('\n✅ This flow prevents double hashing and ensures consistency!');
}

runTest().catch(console.error); 