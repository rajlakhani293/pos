import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithInterceptor } from "./base";
import { getMutation } from "./apiUtils";

const endpointsConfig = {
    getCountries: { query: () => getMutation(`countries`) },
    getStates: { query: ({ id }: { id: string }) => getMutation(`countries/${id}/states`) },
    getCities: { query: ({ id }: { id: string }) => getMutation(`states/${id}/cities`) },
}

export const locations = createApi({
  reducerPath: "locations",
  baseQuery: createBaseQueryWithInterceptor("locations"),
  endpoints: (builder) => {
    const finalEndpoints: Record<string, any> = {};
    for (const [name, config] of Object.entries(endpointsConfig)) {
      if ((config as any).type === "query") {
        finalEndpoints[name] = builder.query(config as any);
      } else {
        finalEndpoints[name] = builder.mutation(config as any);
      }
    }
    return finalEndpoints;
  },
});