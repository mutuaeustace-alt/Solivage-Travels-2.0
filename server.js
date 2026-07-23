require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');
const payment = require('./payment');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'solivage-travels-secret-key-2024-changeme-in-production';
const DB_FILE = path.join(__dirname, 'database.json');

// Email transporter configuration
let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

let db = { users: [], bookings: [], contacts: [], rates: [] };

function loadDb() {
    try {
        if (fs.existsSync(DB_FILE)) {
            db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        }
    } catch (e) {
        logger.info('Creating new database');
    }
}

function saveDb() {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    logger.debug('Database saved');
}

const { initializeDatabase: initializeDbFromFile } = require('./migrations/init-db');

function initDatabase() {
    // Use the migration script to initialize the database
    if (initializeDbFromFile()) {
        // Reload the database after initialization
        loadDb();
        logger.info('Database initialized via migration script');
    } else {
        logger.error('Failed to initialize database via migration script');
        // Fallback to original initialization
        if (!db.users || db.users.length === 0) {
            const hashedPassword = bcrypt.hashSync('solivage2024', 10);
            db.users = [{ id: 1, username: 'admin', password: hashedPassword, created_at: new Date().toISOString() }];
        }
        
        if (!db.rates || db.rates.length === 0) {
            db.rates = [
                { id: 1, vehicle: 'Electric Class', service: 'hourly', base_price: 2500 },
                { id: 2, vehicle: 'Electric Class', service: 'oneway', base_price: 5000 },
                { id: 3, vehicle: 'Executive Class', service: 'hourly', base_price: 3000 },
                { id: 4, vehicle: 'Executive Class', service: 'oneway', base_price: 6000 },
                { id: 5, vehicle: 'Chauffeur Class', service: 'hourly', base_price: 4000 },
                { id: 6, vehicle: 'Chauffeur Class', service: 'oneway', base_price: 8000 },
                { id: 7, vehicle: 'Chauffeur XL', service: 'hourly', base_price: 3500 },
                { id: 8, vehicle: 'Chauffeur XL', service: 'oneway', base_price: 7000 }
            ];
        }
        
        if (!db.bookings) db.bookings = [];
        if (!db.contacts) db.contacts = [];
        
        saveDb();
        logger.info('Database initialized via fallback method');
    }
}

// Email notification functions
async function sendBookingConfirmationEmail(booking) {
    if (!transporter) return;
    
    try {
        await transporter.sendMail({
            from: `"Solivage Travels" <${process.env.EMAIL_FROM}>`,
            to: booking.email,
            subject: 'Booking Confirmation - Solivage Travels',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #c9a86c;">Booking Confirmation</h2>
                    <p>Dear ${booking.name},</p>
                    <p>Thank you for choosing Solivage Travels! Your booking has been received and is currently pending confirmation.</p>
                    <div style="background-color: #1a1a2e; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #ffffff; margin-top: 0;">Booking Details</h3>
                        <p><strong>Booking ID:</strong> ${booking.id}</p>
                        <p><strong>Vehicle:</strong> ${booking.vehicle}</p>
                        <p><strong>Service:</strong> ${booking.service}</p>
                        <p><strong>Pickup:</strong> ${booking.pickup}</p>
                        <p><strong>Dropoff:</strong> ${booking.dropoff}</p>
                        <p><strong>Date & Time:</strong> ${new Date(booking.date).toLocaleString()}</p>
                        ${booking.notes ? `<p><strong>Special Requests:</strong> ${booking.notes}</p>` : ''}
                    </div>
                    <p>We will review your booking and contact you shortly to confirm the details.</p>
                    <p>For any questions, please reply to this email or call us at +254 711 736 594.</p>
                    <p style="color: #c9a86c; font-weight: bold;">Your Journey, Redefined.</p>
                </div>
            `
        });
    } catch (error) {
        console.error('Error sending booking confirmation email:', error);
    }
}

async function sendContactConfirmationEmail(contact) {
    if (!transporter) return;
    
    try {
        await transporter.sendMail({
            from: `"Solivage Travels" <${process.env.EMAIL_FROM}>`,
            to: contact.email,
            subject: 'Message Received - Solivage Travels',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #c9a86c;">Thank You for Your Message</h2>
                    <p>Dear ${contact.name},</p>
                    <p>Thank you for contacting Solivage Travels. We have received your message and will get back to you soon.</p>
                    <div style="background-color: #1a1a2e; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #ffffff; margin-top: 0;">Message Details</h3>
                        <p><strong>Message ID:</strong> ${contact.id}</p>
                        <p><strong>Received:</strong> ${new Date(contact.created_at).toLocaleString()}</p>
                        <p><strong>Message:</strong></p>
                        <p style="background-color: #0d0d1a; padding: 15px; border-radius: 4px;">${contact.message}</p>
                    </div>
                    <p>We typically respond within 24 hours during business days.</p>
                    <p>For urgent matters, please call us at +254 711 736 594.</p>
                    <p style="color: #c9a86c; font-weight: bold;">Your Journey, Redefined.</p>
                </div>
            `
        });
    } catch (error) {
        console.error('Error sending contact confirmation email:', error);
    }
}

async function sendAdminNotificationEmail(booking) {
    if (!transporter) return;
    
    try {
        await transporter.sendMail({
            from: `"Solivage Travels" <${process.env.EMAIL_FROM}>`,
            to: process.env.EMAIL_USER,
            subject: `New Booking Received - ID: ${booking.id}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #c9a86c;">New Booking Received</h2>
                    <p>A new booking has been submitted through the website.</p>
                    <div style="background-color: #1a1a2e; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #ffffff; margin-top: 0;">Booking Details</h3>
                        <p><strong>Booking ID:</strong> ${booking.id}</p>
                        <p><strong>Customer Name:</strong> ${booking.name}</p>
                        <p><strong>Email:</strong> ${booking.email}</p>
                        <p><strong>Phone:</strong> ${booking.phone || 'Not provided'}</p>
                        <p><strong>Vehicle:</strong> ${booking.vehicle}</p>
                        <p><strong>Service:</strong> ${booking.service}</p>
                        <p><strong>Pickup:</strong> ${booking.pickup}</p>
                        <p><strong>Dropoff:</strong> ${booking.dropoff}</p>
                        <p><strong>Date & Time:</strong> ${new Date(booking.date).toLocaleString()}</p>
                        ${booking.notes ? `<p><strong>Special Requests:</strong> ${booking.notes}</p>` : ''}
                    </div>
                    <p><a href="http://${process.env.CORS_ORIGIN || 'localhost:3000'}/admin" style="background-color: #c9a86c; color: #0d0d1a; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View in Admin Panel</a></p>
                </div>
            `
        });
    } catch (error) {
        console.error('Error sending admin notification email:', error);
    }
}

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.users.find(u => u.username === username);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
});

app.get('/api/rates', (req, res) => {
    res.json(db.rates || []);
});

app.post('/api/rates', authenticateToken, (req, res) => {
    const { vehicle, service, base_price } = req.body;
    const existing = db.rates.find(r => r.vehicle === vehicle && r.service === service);
    
    if (existing) {
        existing.base_price = base_price;
    } else {
        db.rates.push({ id: Date.now(), vehicle, service, base_price });
    }
    saveDb();
    res.json({ success: true });
});

app.patch('/api/rates/:id', authenticateToken, (req, res) => {
    const { vehicle, service, base_price } = req.body;
    const rate = db.rates.find(r => r.id === parseInt(req.params.id));
    if (!rate) return res.status(404).json({ error: 'Rate not found' });
    
    rate.vehicle = vehicle;
    rate.service = service;
    rate.base_price = base_price;
    saveDb();
    res.json({ success: true });
});

app.delete('/api/rates/:id', authenticateToken, (req, res) => {
    db.rates = db.rates.filter(r => r.id !== parseInt(req.params.id));
    saveDb();
    res.json({ success: true });
});

app.get('/api/bookings', (req, res) => {
    res.json(db.bookings || []);
});

app.get('/api/bookings/:id', authenticateToken, (req, res) => {
    const booking = db.bookings.find(b => b.id === parseInt(req.params.id));
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
});

app.post('/api/bookings', (req, res) => {
    const { name, email, phone, vehicle, service, pickup, dropoff, date, time, notes } = req.body;
    
    if (!name || !email || !vehicle || !service || !pickup || !dropoff || !date) {
        return res.status(400).json({ error: 'All required fields must be filled' });
    }
    
    const booking = {
        id: Date.now(),
        name, email, phone, vehicle, service, pickup, dropoff, date, time, notes,
        status: 'pending',
        created_at: new Date().toISOString()
    };
    
    db.bookings.unshift(booking);
    saveDb();
    
    // Send emails
    sendBookingConfirmationEmail(booking);
    sendAdminNotificationEmail(booking);
    
    res.json({ success: true, id: booking.id });
});

app.patch('/api/bookings/:id', authenticateToken, (req, res) => {
    const { status } = req.body;
    const booking = db.bookings.find(b => b.id === parseInt(req.params.id));
    if (booking) {
        booking.status = status;
        saveDb();
    }
    res.json({ success: true });
});

app.delete('/api/bookings/:id', authenticateToken, (req, res) => {
    db.bookings = db.bookings.filter(b => b.id !== parseInt(req.params.id));
    saveDb();
    res.json({ success: true });
});

app.get('/api/contacts', authenticateToken, (req, res) => {
    res.json(db.contacts || []);
});

app.post('/api/contacts', (req, res) => {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    const contact = {
        id: Date.now(),
        name, email, message,
        status: 'unread',
        created_at: new Date().toISOString()
    };
    
    db.contacts.unshift(contact);
    saveDb();
    
    // Send confirmation email
    sendContactConfirmationEmail(contact);
    
    res.json({ success: true, id: contact.id });
});

app.patch('/api/contacts/:id', authenticateToken, (req, res) => {
    const { status } = req.body;
    const contact = db.contacts.find(c => c.id === parseInt(req.params.id));
    if (contact) {
        contact.status = status;
        saveDb();
    }
    res.json({ success: true });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Payment routes (placeholder for Stripe integration)
app.post('/api/create-payment-intent', authenticateToken, async (req, res) => {
    try {
        const { bookingId, amount } = req.body;
        
        // In a real implementation, you would fetch the booking from the database
        // For now, we'll use a mock booking
        const mockBooking = {
            id: bookingId || Date.now(),
            name: 'Test Customer',
            email: 'test@example.com',
            vehicle: 'Mercedes V-Class',
            service: 'Airport Transfer'
        };
        
        const paymentIntent = await payment.createPaymentIntent(
            mockBooking, 
            amount || 600000 // Default 6000 KES in cents
        );
        
        res.json(paymentIntent);
    } catch (error) {
        logger.error('Error creating payment intent:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
});

// Stripe webhook endpoint (for production)
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), payment.handleStripeWebhook);

// File upload configuration
const upload = multer({
    dest: process.env.UPLOAD_DIR || './uploads',
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// File upload route (for admin vehicle images, etc.)
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({
        success: true,
        filename: req.file.filename,
        path: `/${req.file.path}`,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
    });
});

// Error handling for multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large' });
        }
        return res.status(400).json({ error: error.message });
    } else if (error) {
        return res.status(400).json({ error: error.message });
    }
    next(err);
});

loadDb();
initDatabase();

const server = app.listen(PORT, () => {
    logger.info(`Solivage Travels server running at http://localhost:${PORT}`);
    logger.info(`Admin panel at http://localhost:${PORT}/admin`);
});

// Handle unhandled promises
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promises
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    process.exit(1);
});