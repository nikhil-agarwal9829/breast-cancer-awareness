// Test appointment data
const testAppointment = {
  name: "Jane Smith",
  email: "jane@example.com",
  phone: "9876543210",
  hospital: "VIT Hope Ribbon Medical Center",
  date: "2023-12-15",
  time: "14:30",
  message: "Follow-up appointment",
  appointmentType: "followup"
};

// Use Node.js built-in fetch (Node 18+)
fetch('http://localhost:3001/api/appointments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testAppointment),
})
.then(response => response.json())
.then(data => {
  console.log('Success:', data);
  
  // Now test getting appointments
  return fetch('http://localhost:3001/api/appointments');
})
.then(response => response.json())
.then(data => {
  console.log('Appointments:', data);
})
.catch((error) => {
  console.error('Error:', error);
});