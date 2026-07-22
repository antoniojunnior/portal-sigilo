import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({ maxInstances: 10, region: "southamerica-east1" });

export { generateDailyInsights } from "./aiInsights";
export { generateMonthlyReports } from "./scheduledReports";
export { webhookAsaas } from "./webhookAsaas";
export { renovarAssinatura } from "./renovarAssinatura";
