import { fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { setUnauthorized, setServerError, setPermissionError } from '../redux/sessionSlice'; 
import { prepareHeadersWithToken } from './apiUtils';
import { showToast } from '../toast';


interface BackendError {
  success: boolean;
  code: string | number;       
  message?: string;
  errors?: any;       
}

const actualBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL, 
  prepareHeaders: prepareHeadersWithToken,
});

export const createBaseQueryWithInterceptor = (
  reducerPath: string
): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> => {
  return async (args, api, extraOptions) => {
    
    let modifiedArgs = args;

    if (typeof args === 'string') {
      modifiedArgs = `${reducerPath}/${args}`;
    } else if (args && typeof args === 'object' && 'url' in args) {
      modifiedArgs = { ...args, url: `${reducerPath}/${args.url}` };
    }

    const result = await actualBaseQuery(modifiedArgs, api, extraOptions);

    // Handle cases where the API returns 200 OK but Indicates failure in the body
    const data = (result.data || result.error?.data) as BackendError;
    const isSuccessInBody = data?.success !== false;

    if (result.error || !isSuccessInBody) {
      // If result.error is missing (200 OK with success: false), we simulate an error
      // so that .unwrap() in components correctly throws.
      const errorData = result.error || { status: 400, data };
      
      const code = data?.code?.toString() || 'UNKNOWN_ERROR';
      const message = data?.message || data?.errors?.message;

      // Auth & Session Errors
      if (code === 'UNAUTHORIZED' || code === 'TOKEN_EXPIRED' || code === 'SESSION_EXPIRED') {
          api.dispatch(setUnauthorized(true));
      }

      // Permission / Forbidden Errors
      else if (code === 'FORBIDDEN' || code === 'PERMISSION_DENIED' || code === 'SUBSCRIPTION_PLAN_LIMIT_REACHED') {
          api.dispatch(setPermissionError({ 
            isError: true, 
            code: code, 
            errors: data?.errors || null 
          }));
      }

      // Show toast for other errors if a message exists
      else if (message) {
        showToast.error(message);

        // Also update Redux state for critical server errors
        if (code === 'SERVER_ERROR' || code === 'DATABASE_ERROR' || code === 'SERVICE_UNAVAILABLE' || (typeof data?.code === 'number' && data.code >= 500)) {
          api.dispatch(setServerError({
            isError: true,
            code: typeof data?.code === 'number' ? data.code : 500,
            message: message
          }));
        }
      }

      // If we manually detected a failure in a 200 OK response, we must return a structure with 'error'
      if (!isSuccessInBody && !result.error) {
        return { error: errorData as FetchBaseQueryError };
      }
    }

    return result;
  };
};
