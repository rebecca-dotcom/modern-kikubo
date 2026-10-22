const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

const prisma = new PrismaClient();

// POST /api/orders — buyer places an order
router.post('/', auth, async (req, res) => {
  const { items, deliveryAddress } = req.body;
  try {
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

    const totalAmount = items.reduce((sum, item) => {
      const p = products.find((p) => p.id === item.productId);
      return sum + p.price * item.quantity;
    }, 0);

    const vendorId = products[0].vendorId;

    const order = await prisma.order.create({
      data: {
        buyerId: req.user.id,
        vendorId,
        deliveryAddress,
        totalAmount,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: products.find((p) => p.id === item.productId).price,
          })),
        },
      },
      include: { items: true },
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/orders/my — buyer's order history
router.get('/my', auth, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { buyerId: req.user.id },
      include: { items: { include: { product: true } }, boda: { include: { user: { select: { name: true, phone: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/orders/:id/status — vendor or admin updates status
router.patch('/:id/status', auth, roles('VENDOR', 'ADMIN', 'BODA'), async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
