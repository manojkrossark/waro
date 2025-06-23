import DashboardHeaderOne from "@/layouts/headers/dashboard/DashboardHeaderOne";
import dynamic from "next/dynamic";
const DynamicComponentWithNoSSR = dynamic(() => import("./Store"), {
  ssr: false,
});
const DashboardInventory = () => {
  return (
    <>
      <DashboardHeaderOne />
      <DynamicComponentWithNoSSR />
    </>
  );
};

export default DashboardInventory;
