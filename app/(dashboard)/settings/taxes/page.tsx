"use client";

import { useState, useMemo } from "react";
import { useTableData } from "@/hooks/useTableData";
import DynamicTable from "@/components/DynamicTable";
import { TaxForm } from "./createUpdate";
import { settings } from "@/lib/api/settings";

const Taxes = () => {
  const [isAddEntityOpen, setAddEntityOpen] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
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
    getMaster: settings.useGetTaxesDataMutation,
    itemsPerPage: 20,
    extraOptions: { refreshTrigger },
  });

  const handleCreateItem = () => {
    setSelectedId(null);
    setAddEntityOpen(true);
  };

  const handleEditItem = (item: any) => {
    setSelectedId(item);
    setAddEntityOpen(true);
  };

  const handleClose = () => {
    setAddEntityOpen(false);
    setSelectedId(null);
  };

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    handleClose();
  };

  const columns = useMemo(
    () => [
      {
        key: "tax_name",
        title: "Tax Name",
      },
      {
        key: "tax_value",
        title: "Tax Rate (%)",
      }
    ],
    [currentPage, itemsPerPage]
  );

  return (
    <>
        <DynamicTable
          tableTitle="Taxes"
          title="Add Tax"
          showSearch={true}
          searchTerm={searchTerm}
          showDateRange={true}
          selectedDateRange={selectedDateRange}
          dateFilters={dateFilters}
          setAddEntityOpen={handleCreateItem}
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
          onEdit={handleEditItem}
        />

      <TaxForm
        isOpen={isAddEntityOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        id={selectedId?.id}
        title={selectedId ? `Edit Tax` : `Add Tax`}
      />
    </>
  );
};

export default Taxes;
