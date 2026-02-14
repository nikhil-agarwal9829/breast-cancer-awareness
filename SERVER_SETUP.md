# Server Setup Guide

## Quick Start

1. **Install Dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   ```
   Or directly:
   ```bash
   node server.js
   ```

3. **Access the Application**:
   - Main site: http://localhost:3001
   - MediHelp: http://localhost:3001/medihelp.html
   - Admin Dashboard: http://localhost:3001/medihelp/admin.html
   - API Health Check: http://localhost:3001/api/health

## Server Features

The single `server.js` file handles:

### Static File Serving
- All HTML files from root directory
- CSS files from `/css`
- JavaScript files from `/js`
- Images from `/images`
- Videos from `/vid`
- MediHelp files from `/medihelp`

### API Endpoints

#### Appointments
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments` - Get appointments (with optional ?hospital= or ?email= query)
- `PATCH /api/appointments/:id` - Update appointment status

#### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get all contact messages

#### Risk Assessment
- `POST /api/analyze-risk` - Analyze breast cancer risk (with image upload support)

#### Health Check
- `GET /api/health` - Server status check

## File Structure

```
project-root/
├── server.js          ← Main server file (run this!)
├── package.json
├── index.html
├── medihelp/
│   ├── medihelp.html
│   ├── admin.html
│   └── uploads/       ← Risk assessment images stored here
├── css/
├── js/
├── images/
└── ...
```

## Notes

- Server runs on port 3001 by default
- MongoDB connection is configured for Atlas
- File uploads are stored in `medihelp/uploads/`
- All API endpoints are prefixed with `/api`

## Troubleshooting

- **Port already in use**: Change `PORT` in server.js or set environment variable
- **MongoDB connection fails**: Check your MongoDB Atlas connection string
- **Static files not loading**: Ensure file paths are correct relative to project root




