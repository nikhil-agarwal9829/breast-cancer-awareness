// Simple test to verify API endpoints
const fetch = require('node-fetch');

async function testAPI() {
  console.log('Testing API endpoints...');
  
  // Test contact endpoint
  try {
    const contactResponse = await fetch('http://localhost:3001/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test Message'
      })
    });
    
    const contactResult = await contactResponse.json();
    console.log('Contact API Response:', contactResult);
  } catch (error) {
    console.error('Error testing contact API:', error);
  }
  
  // Test appointments endpoint
  try {
    const appointmentResponse = await fetch('http://localhost:3001/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Patient',
        email: 'patient@example.com',
        phone: '1234567890',
        hospital: 'Test Hospital',
        date: '2023-12-01',
        time: '10:00',
        message: 'Test Appointment',
        appointmentType: 'consultation'
      })
    });
    
    const appointmentResult = await appointmentResponse.json();
    console.log('Appointment API Response:', appointmentResult);
  } catch (error) {
    console.error('Error testing appointment API:', error);
  }
}

testAPI();