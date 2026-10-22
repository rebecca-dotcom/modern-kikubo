const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

const prisma = new PrismaClient();

// All admin routes require ADMIN role
router.use(auth, roles('ADMIN'));

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  const [vendors, buyers, products, orders, activeSubs] = await Promise.all([
    prisma.vendor.count(),
    prisma.user.count({ where: { role: 'BUYER' } }),
    prisma.product.count({ where: { isAvailable: true } }),
    prisma.order.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
  ]);
  res.json({ vendors, buyers, products, orders, activeSubs });
});

// GET /api/admin/vendors
router.get('/vendors', async (req, res) => {
  const vendors = await prisma.vendor.findMany({
    include: { user: { select: { name: true, email: true, phone: true } }, subscriptions: { take: 1, orderBy: { expiresAt: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(vendors);
});

// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  const orders = await prisma.order.findMany({
    include: {
      buyer: { select: { name: true, phone: true } },
      vendor: { select: { shopName: true } },
      boda: { include: { user: { select: { name: true, phone: true } } } },
      items: { include: { product: { select: { title: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

// GET /api/admin/bodas
router.get('/bodas', async (req, res) => {
  const bodas = await prisma.boda.findMany({
    include: { user: { select: { name: true, phone: true } } },
  });
  res.json(bodas);
});

// PATCH /api/admin/vendors/:id/activate
router.patch('/vendors/:id/activate', async (req, res) => {
  const vendor = await prisma.vendor.update({
    where: { id: req.params.id },
    data: { isActive: req.body.isActive },
  });
  res.json(vendor);
});

module.exports = router;
