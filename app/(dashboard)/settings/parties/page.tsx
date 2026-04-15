"use client";

import { useMemo, useState, useCallback } from "react";
import { useTableData } from "@/hooks/useTableData";
import DynamicTable from "@/components/DynamicTable";
import { settings } from "@/lib/api/settings";
import { PartyForm } from "./createUpdate";
import { DueHistoryDrawer } from "./DueHistoryDrawer";
import { PaymentDrawer } from "./PaymentDrawer";
import { showToast } from "@/lib/toast";

const Parties = () => {
  const [isAddEntityOpen, setAddEntityOpen] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentNote, setPaymentNote] = useState<string>("");
  const [addPartyPayment, { isLoading: paymentSaving }] = settings.useAddPartyPaymentMutation();
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
    getMaster: settings.useGetPartiesDataMutation,
    itemsPerPage: 20,
    extraOptions: { refreshTrigger },
    // disableDateFilter: true,
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

  const openLedgerDrawer = (row: any) => {
    setSelectedParty(row);
    setDrawerOpen(true);
    // Blur the active element to prevent aria-hidden accessibility issue
    (document.activeElement as HTMLElement)?.blur();
  };

  const openPaymentDrawer = (row: any) => {
    setSelectedParty(row);
    setPaymentAmount("");
    setPaymentNote("");
    setPaymentDrawerOpen(true);
    // Blur the active element to prevent aria-hidden accessibility issue
    (document.activeElement as HTMLElement)?.blur();
  };

  const handleAddPayment = async () => {
    if (!selectedParty?.id) {
      showToast.error("Select a party first");
      return;
    }

    const amountNumber = Number(paymentAmount || 0);
    if (!amountNumber || amountNumber <= 0) {
      showToast.error("Enter a valid payment amount");
      return;
    }

    try {
      await addPartyPayment({
        party_id: selectedParty.id,
        amount: amountNumber,
        note: paymentNote?.trim() || undefined,
      }).unwrap();
      showToast.success("Payment recorded successfully");
      setPaymentAmount("");
      setPaymentNote("");
      setPaymentDrawerOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      showToast.error(error?.data?.message || "Failed to record payment");
    }
  };

  const rowActions = useCallback((id: any, record: any) => {
    return [
      {
        key: "pay",
        label: "Pay",
        labelText: "Pay",
        icon: <span className="text-green-600 font-semibold text-sm">₹</span>,
        onClick: (e?: React.MouseEvent<HTMLButtonElement>) => {
          e?.stopPropagation();
          openPaymentDrawer(record);
        },
        priority: 0
      }
    ];
  }, []);

  const renderCurrentBalance = (value: any, record: any) => {
    const balanceType = record?.row?.balance_type;
    const currentBalance = record?.row?.current_balance;

    const balanceColor = balanceType === 2 ? 'text-green-600 dark:text-green-400' : balanceType === 1 ? 'text-red-600 dark:text-red-400' : '';

    return (
      <div className="flex flex-col">
        <button className={`font-medium ${balanceColor} cursor-pointer`} onClick={() => openLedgerDrawer(record.row)}>
          {currentBalance || '0'}
        </button>
      </div>
    );
  };


  const columns = useMemo(
    () => [
      {
        key: "name",
        title: "Party Name",
      },
      {
        key: "party_type",
        title: "Party Type",
        render: (value: any) => {
          const partyType: { [key: string]: string } = {
            "1": "Customer",
            "2": "Supplier",
            "3": "Both"
          };
          return partyType[value.toString()] || value;
        }
      },
      {
        key: "phone_number",
        title: "Phone Number",
      },
      {
        key: "customer_category",
        title: "Customer Category",
        render: (value: any) => {
          const customerCategory: { [key: string]: string } = {
            "1": "Regular",
            "2": "Card Holder",
            "3": "Vara (Home Delivery)"
          };
          return customerCategory[value.toString()] || value;
        }
      },
      {
        key: "current_balance",
        title: "Current Balance",
        render: renderCurrentBalance
      },
    ],
    [currentPage, itemsPerPage]
  );

  return (
    <>
      <div className="h-full">
        <DynamicTable
          tableTitle="Parties"
          title="Add Party"
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
          rowActions={rowActions}
        />

        <PartyForm
          isOpen={isAddEntityOpen}
          onClose={handleClose}
          onSuccess={handleSuccess}
          id={selectedId?.id}
          title={selectedId ? `Edit Party` : `Add Party`}
        />

        <DueHistoryDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          party={selectedParty}
        />

        <PaymentDrawer
          isOpen={paymentDrawerOpen}
          onClose={() => setPaymentDrawerOpen(false)}
          partyName={selectedParty?.name || ""}
          paymentAmount={paymentAmount}
          paymentNote={paymentNote}
          onPaymentAmountChange={setPaymentAmount}
          onPaymentNoteChange={setPaymentNote}
          onAddPayment={handleAddPayment}
          paymentSaving={paymentSaving}
        />
      </div>
    </>
  );
};

export default Parties;
