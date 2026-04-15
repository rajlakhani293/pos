"use client";

import { useState, useMemo } from "react";
import { useTableData } from "@/hooks/useTableData";
import DynamicTable from "@/components/DynamicTable";
import { items } from "@/lib/api/items";
import { UnitForm } from "./createUpdate";

const Units = () => {
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
    getMaster: items.useGetItemUnitsDataMutation,
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
        key: "unit_name",
        title: "Unit Name",
      },
      {
        key: "short_name",
        title: "Unit Short Name",
      }
    ],
    [currentPage, itemsPerPage]
  );

  return (
    <>
       <div className="h-full">
         <DynamicTable
          tableTitle="Item Units"
          title="Add Item Unit"
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

      <UnitForm
        isOpen={isAddEntityOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        id={selectedId?.id}
        title={selectedId ? `Edit Item Unit` : `Add Item Unit`}
      />
       </div>
    </>
  );
};

export default Units;
