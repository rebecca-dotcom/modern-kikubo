const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

const prisma = new PrismaClient();

// POST /api/delivery/register — register as a boda rider
router.post('/register', auth, async (req, res) => {
  const { plateNo } = req.body;
  try {
    const boda = await prisma.boda.create({ data: { userId: req.user.id, plateNo } });
    await prisma.user.update({ where: { id: req.user.id }, data: { role: 'BODA' } });
    res.status(201).json(boda);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/delivery/my — boda sees their assigned deliveries
router.get('/my', auth, roles('BODA'), async (req, res) => {
  try {
    const boda = await prisma.boda.findUnique({ where: { userId: req.user.id } });
    const orders = await prisma.order.findMany({
      where: { bodaId: boda.id },
      include: {
        items: { include: { product: true } },
        buyer: { select: { name: true, phone: true } },
        vendor: { select: { shopName: true, location: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/delivery/:orderId/assign — admin assigns a boda to an order
router.patch('/:orderId/assign', auth, roles('ADMIN'), async (req, res) => {
  const { bodaId } = req.body;
  try {
    const order = await prisma.order.update({
      where: { id: req.params.orderId },
      data: { bodaId, status: 'PICKED_UP' },
    });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
