/**
 * Automates listing of numerical states
 * @param lower the lower bound... i.e., q0
 * @param upper the upper bound... i.e., q15
 * @returns an array from [q0, ..., q15]
 */
export const q = (lower: number, upper: number) =>
  Array.from({ length: upper - lower + 1 }, (_, i) => `q${i + lower}`);
