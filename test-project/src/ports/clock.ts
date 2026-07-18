// Port: the domain/app obtains time only through this interface.
export interface Clock {
  now(): Date;
}
