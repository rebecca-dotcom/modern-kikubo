const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const { orderPlacedVendor, orderStatusBuyer } = require('../services/email');

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
      include: {
        items: { include: { product: { select: { title: true, price: true } } } },
        vendor: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    // Notify vendor by email
    orderPlacedVendor({
      vendorEmail: order.vendor.user.email,
      vendorName:  order.vendor.user.name,
      orderId:     order.id,
      items:       order.items.map(i => ({ title: i.product.title, price: i.price })),
      total:       order.totalAmount,
      address:     order.deliveryAddress,
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

// PATCH /api/orders/:id/status — vendor, admin or boda updates status
router.patch('/:id/status', auth, roles('VENDOR', 'ADMIN', 'BODA'), async (req, res) => {
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
      include: { buyer: { select: { name: true, email: true } } },
    });

    // Notify buyer when boda picks up or delivers
    if (['PICKED_UP', 'DELIVERED'].includes(req.body.status)) {
      orderStatusBuyer({
        buyerEmail: order.buyer.email,
        buyerName:  order.buyer.name,
        orderId:    order.id,
        status:     req.body.status,
      });
    }

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
