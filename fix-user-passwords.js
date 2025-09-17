// TEMPORARY FIX: Set passwords for new users
// Run this in browser console on http://localhost:3000

// Get current credentials
const credentials = JSON.parse(localStorage.getItem('mirage_user_credentials') || '{}');

// Add passwords for new users
credentials['Basil'] = 'password123';
credentials['Dina'] = 'password123';

// Save updated credentials
localStorage.setItem('mirage_user_credentials', JSON.stringify(credentials));

console.log('✅ Passwords set for Basil and Dina users');
console.log('Login credentials:');
console.log('- Basil: password123');
console.log('- Dina: password123');