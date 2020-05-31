import mongoose from 'mongoose';
import { Message } from 'node-nats-streaming';
import { TicketUpdatedEvent } from '@pbtickets/common';
import { natsWrapper } from '../../../nats-wrapper';
import { TicketUpdatedListener } from '../ticket-updated-listener';
import { Ticket } from '../../../models/ticket';

const setup = async () => {
  // Create an instance of the listener
  const listener = new TicketUpdatedListener(natsWrapper.client);

  // Create and sae a ticket
  const ticket = Ticket.build({
    id: await mongoose.Types.ObjectId().toHexString(),
    title: 'concert',
    price: 20,
  });
  await ticket.save();

  // // Create a fake data event
  const data: TicketUpdatedEvent['data'] = {
    id: ticket.id,
    version: ticket.version + 1,
    title: 'movie',
    price: 10,
    userId: '1234',
  };

  // Create a fake message object
  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, data, msg, ticket };
};

it('should find, updated and save a ticket', async () => {
  const { msg, data, ticket, listener } = await setup();

  await listener.onMessage(data, msg);

  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket!.title).toEqual(data.title);
  expect(updatedTicket!.price).toEqual(data.price);
  expect(updatedTicket!.version).toEqual(data.version);
});

it('should ack the message', async () => {
  const { msg, data, ticket, listener } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});

it('should not call ack if the event has a skipped version number', async () => {
  const { msg, data, ticket, listener } = await setup();

  data.version = 10;

  try {
    await listener.onMessage(data, msg);
  } catch (e) {}

  expect(msg.ack).not.toHaveBeenCalled();
});
