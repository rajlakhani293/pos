"use client";

import { useMemo } from "react";
import { useTableData } from "@/hooks/useTableData";
import DynamicTable from "@/components/DynamicTable";
import { sales } from "@/lib/api/sales";
import { useRouter } from "next/navigation";

const Sales = () => {
  const router = useRouter();
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
    getMaster: sales.useGetSalesDataMutation,
    itemsPerPage: 20,
  });

  const handleCreateSale = () => {
    router.push('/sales/create');
  };

  const handleEditSale = (item: any) => {
    router.push(`/sales/${item.id}`);
  };

  const columns = useMemo(
    () => [
      {
        key: "sales_code",
        title: "Sales Code",
      },
      {
        key: "party__name",
        title: "Party Name",
      },
      {
        key: "sales_date",
        title: "Sales Date",
      },
      {
        key: "total_amount",
        title: "Total Amount"
      },
      {
        key: "paid_amount",
        title: "Paid Amount",
      },
      {
        key: "payment_mode",
        title: "Payment Mode",
      }
    ],
    [currentPage, itemsPerPage]
  );

  return (
    <div className="p-4">
      <DynamicTable
        tableTitle="Sales"
        title="Add Sale"
        showSearch={true}
        searchTerm={searchTerm}
        showDateRange={true}
        selectedDateRange={selectedDateRange}
        dateFilters={dateFilters}
        setAddEntityOpen={handleCreateSale}
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
        showDelete={true}
        isLoading={isLoading}
        onEdit={handleEditSale}
      />
    </div>
  );
};

export default Sales;
