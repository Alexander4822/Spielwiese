import { NetWorthChart } from "@/components/net-worth-chart";
import { OverviewAllocation } from "@/components/overview-allocation";
import { getAllocation, snapshots } from "@/lib/dashboard-data";

export default function OverviewPage() {
  const allocation = getAllocation();

  return (
    <div className="space-y-4">
      <OverviewAllocation data={allocation} />
      <NetWorthChart snapshots={snapshots} />
    </div>
  );
}
