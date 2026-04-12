import { DateTime } from 'luxon';
import { ValueObject } from '../value-object';

type DateLxProps = {
    timestamp: number;
};

export class DateLx extends ValueObject<DateLxProps> {
    private constructor() {
        super();
    }

    static create(date: Date | string | number): DateLx {
        const instance = new DateLx();

        let dt: DateTime;

        if (date instanceof Date) {
            dt = DateTime.fromJSDate(date);
        } else if (typeof date === 'string') {
            dt = DateTime.fromISO(date);
        } else {
            dt = DateTime.fromMillis(date);
        }

        Object.defineProperty(instance, 'props', {
            value: { timestamp: dt.toMillis() },
            writable: false,
            configurable: false,
        });

        return instance;
    }

    get value(): number {
        return this.props.timestamp;
    }

    toDateTime(): DateTime {
        return DateTime.fromMillis(this.props.timestamp);
    }

    isAfter(other: DateLx): boolean {
        return this.value > other.value;
    }

    isBefore(other: DateLx): boolean {
        return this.value < other.value;
    }

    isSameDay(other: DateLx): boolean {
        const a = this.toDateTime();
        const b = other.toDateTime();

        return a.hasSame(b, 'day');
    }
}
