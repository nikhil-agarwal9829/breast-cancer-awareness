const mongoose = require('mongoose');

// MongoDB Atlas connection string
const MONGO_URI = 'mongodb+srv://nikhil:txbRq3AIwsdvTXav@cluster0.ej4xtwy.mongodb.net/medihelp?retryWrites=true&w=majority';

// Test connection
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    // Create a simple test schema
    const testSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now }
    });
    const Test = mongoose.model('Test', testSchema);
    
    // Create a test document
    const testDoc = new Test({ name: 'Connection Test' });
    testDoc.save()
      .then(() => {
        console.log('Test document saved successfully');
        mongoose.connection.close();
      })
      .catch(err => {
        console.error('Error saving test document:', err);
        mongoose.connection.close();
      });
  })
  .catch(err => console.error('MongoDB connection error:', err));