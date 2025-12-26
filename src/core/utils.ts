export function assert(condition: boolean): asserts condition {
  if (!condition) {
    const err = new Error('assertion failed');
    alert(err.stack);
    throw err;
  }
}
