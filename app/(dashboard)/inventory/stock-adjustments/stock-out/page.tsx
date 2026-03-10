"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { items } from "@/lib/api/items";
import { useTableData } from "@/hooks/useTableData";
import DynamicTable from "@/components/DynamicTable";
import StockForm from "../../../../../components/StockForm";

export default function StockOutPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const {
    orders,
    totalItems,
    isLoading,
    currentPage,
    setCurrentPage,
    sortConfig,
    handleSort,
    sortableFields,
    handleFilterChange,
    searchTerm,
    selectedDateRange,
    dateFilters,
    itemsPerPage,
  } = useTableData({
    getMaster: items.useGetStockTransactionsMutation,
    itemsPerPage: 20,
    extraOptions: {
      filter: { direction: "OUT" },
      refresh_key: refreshKey,
    },
  });


  const refreshAll = async () => {
    setRefreshKey((prev) => prev + 1);
  };

  const columns = useMemo(
    () => [
      {
        key: "created_at",
        title: "Date",
        render: (value: string) => dayjs(value).format("DD MMM YYYY, hh:mm A"),
      },
      { key: "item_name", title: "Item" },
      { key: "movement_type", title: "Type" },
      { key: "direction", title: "Direction" },
      { key: "quantity", title: "Qty" },
      { key: "balance_after", title: "Balance" },
      { key: "reference_type", title: "Ref Type" },
      { key: "note", title: "Note" },
    ],
    []
  );

  return (
    <>
        <DynamicTable
          tableTitle="Stock Out Transactions"
          title="Add Stock Out"
          setAddEntityOpen={() => setShowForm(true)}
          showSearch={true}
          searchTerm={searchTerm}
          showDateRange={true}
          selectedDateRange={selectedDateRange}
          dateFilters={dateFilters}
          onFilterChange={handleFilterChange}
          data={orders}
          columns={columns}
          sortConfig={sortConfig}
          onSort={handleSort}
          sortableFields={sortableFields}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
          showDelete={false}
          showEdit={false}
          hideActions={true}
          isLoading={isLoading}
        />
        <StockForm 
          isOpen={showForm} 
          onClose={() => setShowForm(false)} 
          onSuccess={refreshAll} 
          type="OUT"
          title="Add Stock Out"
        />
    </>
  );
}
