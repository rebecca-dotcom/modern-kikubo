const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

const prisma = new PrismaClient();

// POST /api/vendors/register — create vendor profile
router.post('/register', auth, async (req, res) => {
  const { shopName, location, description } = req.body;
  try {
    const vendor = await prisma.vendor.create({
      data: { userId: req.user.id, shopName, location, description },
    });
    await prisma.user.update({ where: { id: req.user.id }, data: { role: 'VENDOR' } });
    res.status(201).json(vendor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/vendors/me — vendor's own dashboard data
router.get('/me', auth, roles('VENDOR'), async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: req.user.id },
      include: {
        products: true,
        orders: { include: { items: true }, orderBy: { createdAt: 'desc' } },
        subscriptions: { orderBy: { expiresAt: 'desc' }, take: 1 },
      },
    });
    if (!vendor) return res.status(404).json({ error: 'No shop profile yet' });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/vendors/:id — public vendor shop page
router.get('/:id', async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        products: { where: { isAvailable: true } },
        user: { select: { phone: true } },
      },
    });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/vendors/subscribe — record subscription payment
router.post('/subscribe', auth, roles('VENDOR'), async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const sub = await prisma.subscription.create({
      data: { vendorId: vendor.id, expiresAt, amount: 15000 },
    });
    await prisma.vendor.update({ where: { id: vendor.id }, data: { isActive: true } });
    res.status(201).json(sub);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
