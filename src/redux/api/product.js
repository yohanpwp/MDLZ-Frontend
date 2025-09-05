import { api } from "./baseApi";

export const productApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params) => {
        if (!params) {
          return "/products";
        }
        const searchParams = new URLSearchParams();
        if (params.page !== undefined) {
          searchParams.append("page", String(params.page));
        }
        if (params.pageSize !== undefined) {
          searchParams.append("pageSize", String(params.pageSize));
        }
        if (params.search !== undefined) {
          searchParams.append("search", String(params.search));
        }
        if (params.orderedBy !== undefined) {
          searchParams.append("orderedBy", String(params.orderedBy));
        }
        return `/products?${searchParams.toString()}`;
      },
      providesTags: (res) =>
        res
          ? [res.data.map((o) => ({ type: "Products", id: o.id })), "Products"]
          : ["Products"],
    }),
    updateProduct: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: "Products", id: arg.id }],
    }),
  }),
});

export const { useGetProductsQuery, useUpdateProductMutation } = customerApi;
