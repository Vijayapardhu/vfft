"use client";

import {
  type DocumentReference,
  type FirestoreError,
  type Query,
  onSnapshot,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import type { WithId } from "@/types";

interface QueryState<T> {
  data: WithId<T>[];
  loading: boolean;
  error: FirestoreError | null;
}

/**
 * Subscribe to a Firestore query in real time. Pass `null` to disable (e.g.
 * before the active season / credentials are known) — the hook resolves to an
 * empty, non-loading state instead of erroring.
 *
 * `deps` controls re-subscription: pass the primitive values the query is built
 * from (NOT the query object, which is a new reference every render).
 */
export function useCollectionData<T>(
  query: Query<T> | null,
  deps: React.DependencyList,
): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({
    data: [],
    loading: Boolean(query),
    error: null,
  });

  useEffect(() => {
    if (!query) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const unsubscribe = onSnapshot(
      query,
      (snap) => {
        const data = snap.docs.map(
          (d) => ({ ...d.data(), id: d.id }) as WithId<T>,
        );
        setState({ data, loading: false, error: null });
      },
      (error) => setState({ data: [], loading: false, error }),
    );
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

interface DocState<T> {
  data: WithId<T> | null;
  loading: boolean;
  error: FirestoreError | null;
}

/** Subscribe to a single document in real time. Pass `null` to disable. */
export function useDocumentData<T>(
  ref: DocumentReference<T> | null,
  deps: React.DependencyList,
): DocState<T> {
  const [state, setState] = useState<DocState<T>>({
    data: null,
    loading: Boolean(ref),
    error: null,
  });

  useEffect(() => {
    if (!ref) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        setState({
          data: snap.exists() ? ({ ...snap.data(), id: snap.id } as WithId<T>) : null,
          loading: false,
          error: null,
        });
      },
      (error) => setState({ data: null, loading: false, error }),
    );
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
