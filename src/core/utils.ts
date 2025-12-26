export function assert(condition: boolean): asserts condition {
  if (!condition) {
    alert('assertion failed');
    throw new Error('assertion failed');
  }
}
