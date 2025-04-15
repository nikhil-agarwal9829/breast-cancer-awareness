const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Appointments file path
const APPOINTMENTS_FILE = 'data/appointments.json';

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.mkdir('data', { recursive: true });
    } catch (err) {
        console.error('Error creating data directory:', err);
    }
}

// Initialize appointments file if it doesn't exist
async function initAppointmentsFile() {
    try {
        await fs.access(APPOINTMENTS_FILE);
    } catch {
        await fs.writeFile(APPOINTMENTS_FILE, JSON.stringify([]));
    }
}

// API endpoint to save appointment
app.post('/api/appointments', async (req, res) => {
    try {
        const appointment = req.body;
        
        // Read existing appointments
        const data = await fs.readFile(APPOINTMENTS_FILE, 'utf8');
        const appointments = JSON.parse(data);
        
        // Add new appointment
        appointments.push(appointment);
        
        // Save updated appointments
        await fs.writeFile(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2));
        
        res.json({ success: true, message: 'Appointment booked successfully' });
    } catch (error) {
        console.error('Error saving appointment:', error);
        res.status(500).json({ success: false, message: 'Error saving appointment' });
    }
});

// API endpoint to get all appointments (for admin panel)
app.get('/api/appointments', async (req, res) => {
    try {
        const data = await fs.readFile(APPOINTMENTS_FILE, 'utf8');
        const appointments = JSON.parse(data);
        res.json(appointments);
    } catch (error) {
        console.error('Error reading appointments:', error);
        res.status(500).json({ success: false, message: 'Error reading appointments' });
    }
});

// API endpoint to update appointment status
app.put('/api/appointments/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Read existing appointments
        const data = await fs.readFile(APPOINTMENTS_FILE, 'utf8');
        const appointments = JSON.parse(data);
        
        // Find and update appointment
        const appointment = appointments.find(a => a.appointmentId.toString() === id);
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        
        appointment.status = status;
        
        // Save updated appointments
        await fs.writeFile(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2));
        
        res.json({ success: true, message: 'Appointment status updated successfully' });
    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({ success: false, message: 'Error updating appointment status' });
    }
});

// Initialize server
async function initServer() {
    await ensureDataDir();
    await initAppointmentsFile();
    
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

initServer(); 