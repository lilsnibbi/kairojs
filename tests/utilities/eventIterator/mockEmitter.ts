import { EventEmitter } from "node:events";
import { EventIterator } from "@utilities/eventIterator/index.ts";
import type { EventIteratorOptions } from "@types";
import { Person } from "./person.ts";

export class PeopleIterator extends EventIterator<[Person]> {}

export const people = [
	new Person("Anna"),
	new Person("Bob"),
	new Person("Joe"),
];

export class PeopleEmitter extends EventEmitter {
	readonly #people = people;

	#emitted = 0;

	#timeout: ReturnType<typeof setInterval> | null = null;

	#iterator: PeopleIterator | null = null;

	public init(): void {
		this.#timeout = setInterval((): void => {
			if (this.#emitted === this.#people.length) {
				clearInterval(this.#timeout!);
				this.#timeout = null;
				this.#iterator?.end();
				this.#iterator = null;
			} else {
				this.emit("testEvent", this.#people[this.#emitted++]);
			}
		}, 1000);
	}

	public createPeopleIterator(
		options?: EventIteratorOptions<[Person]>,
	): PeopleIterator {
		this.#iterator = new PeopleIterator(this, "testEvent", options);
		this.init();
		return this.#iterator;
	}

	public destroy(): void {
		if (this.#timeout) {
			this.#timeout.unref();
			clearInterval(this.#timeout);
		}
	}
}
