"use client";

import { useState, useMemo } from "react";
import { useTableData } from "@/hooks/useTableData";
import DynamicTable from "@/components/DynamicTable";
import { settings } from "@/lib/api/settings";
import { BranchForm } from "./createUpdate";

const Branches = () => {
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
    itemsPerPage,
  } = useTableData({
    getMaster: settings.useGetBranchesDataMutation,
    itemsPerPage: 20,
    extraOptions: { refreshTrigger },
    disableDateFilter: true,
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
        key: "branch_name",
        title: "Branch Name",
      },
      {
        key: "city__name",
        title: "City",
      },
      {
        key: "state__name",
        title: "State",
      }
    ],
    [currentPage, itemsPerPage]
  );

  return (
    <>
      <div className="h-full">
        <DynamicTable
          tableTitle="Branches"
          title="Add Branch"
          showSearch={true}
          searchTerm={searchTerm}
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
          showDelete={false}
          isLoading={isLoading}
          onEdit={handleEditItem}
        />

        <BranchForm
          isOpen={isAddEntityOpen}
          onClose={handleClose}
          onSuccess={handleSuccess}
          id={selectedId?.id}
          title={selectedId ? `Edit Branch` : `Add Branch`}
        />

      </div>
    </>
  );
};

export default Branches;
