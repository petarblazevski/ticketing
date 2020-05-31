import { OrderCreatedEvent, Publisher, Subjects } from '@pbtickets/common';

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
}
