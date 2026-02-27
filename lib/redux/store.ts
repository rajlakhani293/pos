import { configureStore } from '@reduxjs/toolkit';
import { auth } from '../api/auth';
import { locations } from '../api/locations';
import { items } from '../api/items';
import { sales } from '../api/sales';
import { settings } from '../api/settings';
import sessionSlice from './sessionSlice';

export const store = configureStore({
  reducer: {
    auth: auth.reducer,
    locations: locations.reducer,
    items: items.reducer,
    sales: sales.reducer,
    settings: settings.reducer,
    session: sessionSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([auth.middleware, locations.middleware, items.middleware, sales.middleware, settings.middleware]),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
