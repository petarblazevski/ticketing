import mongoose from 'mongoose';
import request from 'supertest';
import { OrderStatus } from '@pbtickets/common';
import { app } from '../../app';
import { Order } from '../../models/order';
import { stripe } from '../../stripe';
import { Payment } from '../../models/payments';

it('should return a 404 when purchasing an order that does not exist', async () => {
  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      token: '123',
      orderId: mongoose.Types.ObjectId().toHexString(),
    })
    .expect(404);
});

it('should return a 401 when purchasing an order that does not belong to the user', async () => {
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    price: 20,
    status: OrderStatus.Created,
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({
      token: '123',
      orderId: order.id,
    })
    .expect(401);
});

it('should return a 400 when purchasing a cancelled order', async () => {
  const userId = mongoose.Types.ObjectId().toHexString();
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId: userId,
    version: 0,
    price: 20,
    status: OrderStatus.Cancelled,
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: '123',
      orderId: order.id,
    })
    .expect(400);
});

it('should return a 201 with valid inputs', async () => {
  const price = Math.floor(Math.random() * 100000);
  const userId = mongoose.Types.ObjectId().toHexString();
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId: userId,
    version: 0,
    price,
    status: OrderStatus.Created,
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', global.signin(userId))
    .send({
      token: 'tok_visa',
      orderId: order.id,
    })
    .expect(201);

  const stripeCharges = await stripe.charges.list({ limit: 50 });
  const stripeCharge: any = stripeCharges.data.filter(
    (charge) => charge.amount === price * 100
  );

  expect(stripeCharge).toBeDefined();
  expect(stripeCharge[0].currency).toEqual('usd');

  const payment = await Payment.findOne({
    orderId: order.id,
    stripeId: stripeCharge[0].id,
  });

  expect(payment).not.toBeNull();
});
