import {
  ExpirationCompleteEvent,
  Publisher,
  Subjects,
} from '@pbtickets/common';

export class ExpirationCompletePublisher extends Publisher<
  ExpirationCompleteEvent
> {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
}
