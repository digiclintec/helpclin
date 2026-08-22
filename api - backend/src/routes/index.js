import { Router } from 'express';

import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import serviceOrdersRoutes from './service-orders.routes.js';
import supportTicketsRoutes from './support-tickets.routes.js';
import reportsRoutes from './reports.routes.js';
import adminUsersRoutes from './admin-users.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/service-orders', serviceOrdersRoutes);
router.use('/support-tickets', supportTicketsRoutes);
router.use('/reports', reportsRoutes);
router.use('/admin/users', adminUsersRoutes);

export default router;
