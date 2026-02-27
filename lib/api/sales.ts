import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithInterceptor } from "./base";
import { createMutation, deleteMutation, getMutation, postMutation, putMutation } from "./apiUtils";

const endpointsConfig = {
  // Sales Endpoints
  getSalesData: { query: postMutation("get-transactions") },
  createSale: { query: createMutation("") },
  editSale: { query: ({ id, payLoad }: { id: any; payLoad: any }) => putMutation(`${id}`, payLoad) },
  deleteSale: { query: deleteMutation("delete") },
  getSaleById: { query: ({ id }: { id: number }) => getMutation(`${id}`) },
}

export const sales = createApi({
  reducerPath: "sales",
  baseQuery: createBaseQueryWithInterceptor("sales"),
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
