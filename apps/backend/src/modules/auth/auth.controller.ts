import { Router, Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';

const router = Router();

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, name } = req.body;
        const result = await authService.register(email, password, name);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

export default router;
