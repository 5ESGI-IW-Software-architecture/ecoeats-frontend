import { Observable, tap, catchError, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, WritableSignal } from '@angular/core';
import { getApiError } from '../types/api.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentState, setError, setLoading, setSuccess } from '../types/state.types';

function handelResponseObservable<TInput, TOutput>(options: {
  state: WritableSignal<ComponentState<TOutput>>;
  destroyRef: DestroyRef;
  mapFn?: (data: TInput) => TOutput;
  onSuccess?: (data: TOutput) => void;
  onError?: (error: HttpErrorResponse) => void;
}) {
  return (source: Observable<TInput>) => {
    setLoading(options.state);

    return source.pipe(
      takeUntilDestroyed(options.destroyRef),
      tap((data) => {
        const mappedData = options.mapFn ? options.mapFn(data) : (data as unknown as TOutput);
        setSuccess(options.state, mappedData);
        options.onSuccess?.(mappedData);
      }),
      catchError((httpError: HttpErrorResponse) => {
        setError(options.state, getApiError(httpError));
        options.onError?.(httpError);
        return of(void 0);
      }),
    );
  };
}

function executeObservable<T, C = void>(
  observable: Observable<T>,
  options: {
    state: WritableSignal<ComponentState<C>>;
    destroyRef: DestroyRef;
    mapData?: (data: T) => C;
    onSuccess?: (data: T) => void;
    onError?: (error: HttpErrorResponse) => void;
  },
): void {
  setLoading(options.state);

  observable
    .pipe(
      takeUntilDestroyed(options.destroyRef),
      tap((data: T) => {
        const mappedData = options.mapData ? options.mapData(data) : (data as unknown as C);

        setSuccess(options.state, mappedData);
        options.onSuccess?.(data);
      }),
      catchError((httpError: HttpErrorResponse) => {
        setError(options.state, getApiError(httpError));
        options.onError?.(httpError);
        return of(void 0);
      }),
    )
    .subscribe();
}

export { handelResponseObservable, executeObservable };
