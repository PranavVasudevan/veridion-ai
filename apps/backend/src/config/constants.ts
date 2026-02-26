export const APP_CONSTANTS = {
    JWT_EXPIRY_SECONDS: 30 * 60, // 30 minutes
    BCRYPT_ROUNDS: 10,
    CORS_ORIGIN: ['http://localhost:5173', 'http://localhost:3001'], // Vite dev + alt
    HEALTH_INDEX_THRESHOLDS: {
        RED: 40,
        AMBER: 70,
        GREEN: 100,
    },
    BIAS_THRESHOLDS: {
        LOW: 0.33,
        MODERATE: 0.66,
        HIGH: 1.0,
    },
} as const;
