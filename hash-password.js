import bcrypt from 'bcrypt';

async function hashPassword() {
  const password = 'osamaaboelnour';
  const saltRounds = 12;
  
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('🔐 Password hashed successfully!');
    console.log('📝 Original password:', password);
    console.log('🔒 Hashed password:', hashedPassword);
    console.log('💡 Copy the hashed password above to use in your website');
  } catch (error) {
    console.error('❌ Error hashing password:', error);
  }
}

hashPassword(); 