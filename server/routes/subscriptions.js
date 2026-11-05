const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

const prisma = new PrismaClient();

const PLANS = {
  MONTHLY:   { amount: 50000,  days: 30  },
  QUARTERLY: { amount: 120000, days: 90  },
  YEARLY:    { amount: 400000, days: 365 },
};

// POST /api/subscriptions/pay — vendor pays for a subscription
router.post('/pay', auth, roles('VENDOR'), async (req, res) => {
  try {
    const { plan, phone, provider } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });
    if (!phone || !provider) return res.status(400).json({ error: 'Phone and provider required' });

    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    const { amount, days } = PLANS[plan];
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Expire any existing active subscriptions
    await prisma.subscription.updateMany({
      where: { vendorId: vendor.id, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    });

    // Create new subscription
    const sub = await prisma.subscription.create({
      data: { vendorId: vendor.id, amount, expiresAt, status: 'ACTIVE', plan },
    });

    // Activate vendor shop
    await prisma.vendor.update({
      where: { id: vendor.id },
      data: { isActive: true },
    });

    res.json({ success: true, subscription: sub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
