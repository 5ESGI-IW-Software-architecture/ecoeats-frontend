import { ApiError } from './api.types';
import { WritableSignal } from '@angular/core';

export type ComponentState<T> = {
  loading: boolean;
  success: boolean;
  error: ApiError | null;
  data: T | null;
};

export function createState<T = void>(): ComponentState<T> {
  return {
    loading: false,
    success: false,
    error: null,
    data: null,
  };
}

export function setLoading<T>(state: WritableSignal<ComponentState<T>>): void {
  state.update((s) => ({ ...s, loading: true, error: null }));
}

export function setSuccess<T>(state: WritableSignal<ComponentState<T>>, data?: T): void {
  state.update((s) => ({
    ...s,
    loading: false,
    success: true,
    error: null,
    data: data ?? null,
  }));
}

export function setError<T>(state: WritableSignal<ComponentState<T>>, error: ApiError): void {
  state.update((s) => ({
    ...s,
    loading: false,
    success: false,
    error,
  }));
}

export function resetState<T>(state: WritableSignal<ComponentState<T>>): void {
  state.set(createState<T>());
}
