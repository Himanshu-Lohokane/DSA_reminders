/**
 * Authenticated API wrapper that automatically handles token refresh on 401 errors
 * @param url API endpoint
 * @param options Fetch options
 * @param refreshToken Function to refresh the auth token
 * @returns Fetch response
 */
export async function authenticatedFetch(
    url: string,
    options: RequestInit,
    refreshToken: () => Promise<string | null>
): Promise<Response> {
    // Make initial request
    let response = await fetch(url, options);

    // If we get a 401, try to refresh the token and retry once
    if (response.status === 401) {
        const newToken = await refreshToken();
        
        if (newToken && options.headers) {
            // Retry with new token
            const headers = new Headers(options.headers);
            headers.set('Authorization', `Bearer ${newToken}`);
            
            response = await fetch(url, {
                ...options,
                headers,
            });
        }
    }

    return response;
}

/**
 * Creates an authenticated fetch function with the refresh token bound
 */
export function createAuthenticatedFetch(refreshToken: () => Promise<string | null>) {
    return (url: string, options: RequestInit) => 
        authenticatedFetch(url, options, refreshToken);
}
