const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorMiddleware');
const prisma = require('./config/database');
const AppError = require('./utils/AppError');
const { globalLimiter, authLimiter } = require('./middlewares/rateLimit');

dotenv.config();

const app = express();
app.set('trust proxy', 1); // Trust Cloudflare/Nginx proxy
const PORT = process.env.PORT || 3000;

const authRoutes = require('./routes/authRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const generalRoutes = require('./routes/generalRoutes');
const adminRoutes = require('./routes/adminRoutes');

// New role-based routes
const kuaRoutes = require('./routes/kuaRoutes');
const operatorRoutes = require('./routes/operatorRoutes');
const verifierRoutes = require('./routes/verifierRoutes');
const kemenagRoutes = require('./routes/kemenagRoutes');

// Middleware - Security Headers with Content Security Policy
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // TailwindCSS requires unsafe-inline
            imgSrc: ["'self'", "data:", "https:", "blob:"], // Allow blob for previews
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'"], // Allow iframes from self
            baseUri: ["'self'"],
            formAction: ["'self'"],
            // Allow frontend to frame this API (for PDF previews)
            frameAncestors: ["'self'", "https://ht.nasruladitri.space", "http://localhost:2200"],
            upgradeInsecureRequests: [],
        },
    },
    // Allow images to be loaded by other domains (frontend)
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// CORS Configuration with whitelist
const corsOptions = {
    origin: (origin, callback) => {
        // Get allowed origins from env (supports multiple origins separated by comma)
        const allowedOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
            : ['http://localhost:2200'];

        // Allow requests with no origin (mobile apps, Postman, curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies/authorization headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600 // Cache preflight requests for 10 minutes
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files - Serve templates and uploads
app.use('/templates', express.static(path.join(__dirname, '../public/templates')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request Logger Middleware
app.use((req, res, next) => {
    logger.http(`${req.method} ${req.url}`);
    next();
});

// Routes - New role-based structure (UPDATE.MD compliant)
app.use('/api/v1/auth', authLimiter, authRoutes);
// app.use('/api/v1/auth', authRoutes); // RATE LIMIT DISABLED FOR DEBUGGING
app.use('/api', globalLimiter); // General limit for all APIs

// Role-based routes
app.use('/api/v1/kua', kuaRoutes);
app.use('/api/v1/dukcapil/operator', operatorRoutes);
app.use('/api/v1/dukcapil/verifier', verifierRoutes);
app.use('/api/v1/kemenag', kemenagRoutes);
app.use('/api/v1/admin', adminRoutes);

// General routes (dashboard, reports, master data)
app.use('/api/v1', generalRoutes);

// Legacy routes (backward compatibility - optional, can be removed after frontend migration)
app.use('/api/v1/submissions', submissionRoutes);
app.use('/api/v1/verifications', verificationRoutes);

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'KUA-Dukcapil Internal System API' });
});

// 404 Handler
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

// Graceful Shutdown
const gracefulShutdown = async () => {
    logger.info('Received kill signal, shutting down gracefully');
    server.close(() => {
        logger.info('Closed out remaining connections');
        process.exit(0);
    });

    try {
        await prisma.$disconnect();
        logger.info('Prisma disconnected');
    } catch (err) {
        logger.error('Error during disconnection', err);
        process.exit(1);
    }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
