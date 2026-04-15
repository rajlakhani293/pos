"use client";

import { useMemo } from "react";
import { useTableData } from "@/hooks/useTableData";
import DynamicTable from "@/components/DynamicTable";
import { settings } from "@/lib/api/settings";

const PaymentPage = () => {
  const formatMoney = (value: number | string | undefined | null) =>
    `₹${Number(value || 0).toFixed(2)}`;

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
    getMaster: settings.useGetPaymentHistoryMutation,
    itemsPerPage: 20,
  });

  const columns = useMemo(
    () => [
      {
        key: "party__name",
        title: "Party",
      },
      {
        key: "date",
        title: "Date",
        render: (value: any) => (value ? new Date(value).toLocaleDateString() : "-"),
      },
      {
        key: "amount",
        title: "Amount",
        render: (value: any) => (
          <span className="text-emerald-600 font-semibold">{formatMoney(value)}</span>
        ),
      },
      {
        key: "note",
        title: "Note",
      },
    ],
    []
  );

  return (
   <div className="h-full">
     <DynamicTable
      tableTitle="Payments"
      showSearch={true}
      searchTerm={searchTerm}
      showDateRange={true}
      dateFilters={dateFilters}
      selectedDateRange={selectedDateRange}
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
      isLoading={isLoading}
    />
   </div>
  );
};

export default PaymentPage;
