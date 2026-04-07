import { useMemo } from 'react';

export function useQuery() {
    const { search } = window.location;
    return useMemo(
        () => Object.fromEntries(new URLSearchParams(search)),
        [search],
    );
}
