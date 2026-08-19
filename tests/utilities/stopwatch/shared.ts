/**
 * Replaces the original suite's `promisify(setTimeout)` helper.
 */
export const sleep = (milliseconds: number): Promise<void> =>
	Bun.sleep(milliseconds);
