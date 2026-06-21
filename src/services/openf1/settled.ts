export function fulfilledArray<T>(result: PromiseSettledResult<T[]>): T[] {
  return result.status === 'fulfilled' ? result.value : [];
}

export function hasRejected(results: PromiseSettledResult<unknown>[]): boolean {
  return results.some(result => result.status === 'rejected');
}
