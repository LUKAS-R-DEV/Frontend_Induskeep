import * as Reports from "./modules/reports.js";
import * as Analytics from "./modules/analytics.js";
import * as Machines from "./modules/machines.js";
import * as Users from "./modules/users.js";
import * as Inventory from "./modules/inventory.js";

export const ExportFactory = {
  reports: Reports.exportReports,
  analytics: Analytics.exportAnalytics,
  machines: Machines.exportMachines,
  users: Users.exportUsers,
  inventory: Inventory.exportInventory,
};
