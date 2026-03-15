"use client";

import { useMemo, useState, useCallback } from "react";
import { useTableData } from "@/hooks/useTableData";
import DynamicTable from "@/components/DynamicTable";
import { sales } from "@/lib/api/sales";
import { useRouter } from "next/navigation";
import { MdOutlineSettingsBackupRestore } from "react-icons/md";
import dayjs from "dayjs";
import { showToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit } from "lucide-react";

const Sales = () => {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<{ id: number | string; sales_code?: string } | null>(null);
  const [fullReturnSale, { isLoading: isReverting }] = sales.useFullReturnSaleMutation();
  
  // Payment mode choices mapping
  const PAYMENT_MODE_CHOICES = [
    { value: 1, label: 'Cash' },
    { value: 2, label: 'UPI' },
    { value: 3, label: 'Partial' },
    { value: 4, label: 'Bank Transfer' },
  ];

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
    extraOptions: { refresh_key: refreshKey },
  });

  const handleCreateSale = () => {
    router.push('/sales/create');
  };

  const openFullReturnConfirm = (record: any) => {
    if (record?.is_reverted) {
      showToast.error("Sale already reverted");
      return;
    }
    setSelectedSale({ id: record?.id, sales_code: record?.sales_code });
    setConfirmOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!selectedSale) return;
    try {
      const result = await fullReturnSale({
        id: Number(selectedSale.id),
        payLoad: {},
      }).unwrap() as { message?: string };
      showToast.success(result?.message || "Sales reverted successfully");
      setConfirmOpen(false);
      setSelectedSale(null);
      setRefreshKey((prev) => prev + 1);
    } catch (error: any) {
      const errorData = error?.data;
      showToast.error(errorData?.message || "Failed to revert sale");
    }
  };

  const rowActions = useCallback((id: any, record: any) => {
    return [
      {
        key: "return",
        label: "Full Return",
        labelText: "Full Return",
        icon: <MdOutlineSettingsBackupRestore className="size-5" />,
        onClick: () => {
          openFullReturnConfirm(record);
        },
        priority: 1,
      },
      {
        key: "update",
        label: "Return/Update",
        labelText: "Return/Update",
        icon: <Edit className="size-5" />,
        onClick: () => {
          router.push(`/sales/${id}`);
        },
        priority: 2,
      },
    ];
  }, [router, openFullReturnConfirm]);

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
        key: "total_amount",
        title: "Total Amount"
      },
      {
        key: "payment_mode",
        title: "Payment Mode",
        render: (value: any, record: any) => {
          const paymentMode = PAYMENT_MODE_CHOICES.find(mode => mode.value === value);
          const modeLabel = paymentMode ? paymentMode.label : value;
          
          if (value === 3) { // Partial payment mode
            return (
              <div>
                <div>{modeLabel}</div>
                <div className="text-sm text-muted-foreground">Paid: {record?.row?.paid_amount}</div>
              </div>
            );
          }
          
          return modeLabel;
        }
      },
      {
        key: "is_reverted",
        title: "Status",
        render: (value: boolean) => {
          if (value) {
            return (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                Reverted
              </span>
            );
          }
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Active
            </span>
          );
        }
      }
    ],
    [currentPage, itemsPerPage, PAYMENT_MODE_CHOICES]
  );

  return (
    <>
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
        showDelete={false}
        showEdit={false}
        isLoading={isLoading}
        rowActions={rowActions}
        isRowDisabled={(record) => record?.is_reverted === true}
      />
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revert Full Sale</DialogTitle>
            <DialogDescription>
              This will return all remaining quantities to stock
              {selectedSale?.sales_code ? ` for ${selectedSale.sales_code}` : ""}.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isReverting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmReturn} disabled={isReverting}>
              Confirm Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
  );
};

export default Sales;
