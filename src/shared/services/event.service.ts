import { Injectable, Logger } from '@nestjs/common';

import { EventEmitter2 } from '@nestjs/event-emitter';

import { EEventType, IEvent, IEventOptions } from 'src/interfaces';

@Injectable()
export class EventService {
  constructor(private eventEmitter: EventEmitter2) {}
  private readonly logger = new Logger(EventService.name);

  custom(
    origin: string,
    action: string,
    payload: any,
    options?: Partial<IEventOptions>,
  ) {
    this.apply(origin, action, payload, options);
  }

  create(origin: string, payload: any, options?: Partial<IEventOptions>) {
    this.apply(origin, 'create', payload, options);
  }

  update(origin: string, payload: any, options?: Partial<IEventOptions>) {
    this.apply(origin, 'update', payload, options);
  }

  remove(origin: string, payload: any, options?: Partial<IEventOptions>) {
    this.apply(origin, 'remove', payload, options);
  }

  emit(event: string, data: IEvent) {
    this.logger.log(`Emitting event: ${event}`);
    this.eventEmitter.emit(event, data);
  }

  private apply(
    origin: string,
    action: string,
    payload: any,
    options?: Partial<IEventOptions>,
  ) {
    const eventName = `${process.env.SERVER_NAME}.${origin}.${action}`;

    this.emit(eventName, {
      payload,
      options: {
        type: EEventType.PUBLIC,
        time: new Date(),
        tenantId: null,
        ...options,
        eventName,
      },
    });
  }
}
