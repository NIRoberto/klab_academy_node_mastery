import { Router } from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus
} from '../controllers/order.controller';
import authenticate from '../middlewares/authenticate';

const router = Router();

// User routes (require authentication)
router.use(authenticate);

// POST /api/v1/orders - Create order from cart
router.post('/', createOrder);

// GET /api/v1/orders - Get user's orders
router.get('/', getUserOrders);

// GET /api/v1/orders/:id - Get specific order
router.get('/:id', getOrderById);

// PUT /api/v1/orders/:id/cancel - Cancel order
router.put('/:id/cancel', cancelOrder);

// Admin routes (would need admin middleware in real app)
// GET /api/v1/orders/admin/all - Get all orders (admin)
router.get('/admin/all', getAllOrders);

// PUT /api/v1/orders/admin/:id/status - Update order status (admin)
router.put('/admin/:id/status', updateOrderStatus);

export default router;