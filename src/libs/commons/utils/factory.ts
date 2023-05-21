export function guardFactory<T>(
  fn: (input: any) => boolean
): GuardFn<T> {

  function k(o: any): o is T {
    return fn(o);
  }

  function n<I>(o: I): o is Exclude<I, T> {
    return !fn(o);
  }

  k.non = n;
  return k;
}
export interface GuardFn<T> {
  (o: any): o is T;
  non<I>(o: I): o is Exclude<I, T>;
}