"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StockInView from "./stock-in/page";
import StockOutView from "./stock-out/page";

const StockAdjustmentsPage = () => {
    return (
        <>
            <Tabs defaultValue="stock-in" className="flex flex-col w-full h-full">
                <TabsList className="mb-4 inline-flex">
                    <TabsTrigger value="stock-in">Stock In</TabsTrigger>
                    <TabsTrigger value="stock-out">Stock Out</TabsTrigger>
                </TabsList>
                <div className="flex-1 w-full">
                    <TabsContent value="stock-in" className="h-full w-full">
                        <StockInView />
                    </TabsContent>
                    <TabsContent value="stock-out" className="h-full w-full">
                        <StockOutView />
                    </TabsContent>
                </div>
            </Tabs>
        </>
    );
};

export default StockAdjustmentsPage;