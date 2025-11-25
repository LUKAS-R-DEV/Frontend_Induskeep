import * as Reports from "./modules/reports.js";
import * as Analytics from "./modules/analytics.js";
import * as Machines from "./modules/machines.js";
import * as Users from "./modules/users.js";
import * as Inventory from "./modules/inventory.js";
import * as History from "./modules/history.js";

export const ExportFactory = {
  reports: Reports.exportReports,
  history: History.exportHistory,
  analytics: Analytics.exportAnalytics,
  machines: Machines.exportMachines,
  users: Users.exportUsers,
  inventory: Inventory.exportInventory,
};
