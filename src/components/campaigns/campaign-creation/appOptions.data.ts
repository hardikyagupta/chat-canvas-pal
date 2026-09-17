export interface AppOption {
  id: string;
  name: string;
  platform: "ios" | "android";
}

/** Registered apps/assets a push send can target — shared by the audience
 *  step's "Select app(s)" field and the assets step's "Select asset(s)"
 *  field, since both pick from the same registered-app list. */
export const APP_OPTIONS: AppOption[] = [
  { id: "testing", name: "Pranaglow Test App iOS", platform: "ios" },
  { id: "neww_1", name: "Pranaglow Consumer App iOS", platform: "ios" },
  { id: "qa_test_1", name: "Pranaglow QA App iOS", platform: "ios" },
  { id: "testing_android_app", name: "Pranaglow Test App Android", platform: "android" },
  { id: "app_save_1", name: "Pranaglow Staging App iOS", platform: "ios" },
  { id: "set_ip_save", name: "Pranaglow QA App Android", platform: "android" },
  { id: "cart_recovery_android", name: "Pranaglow Consumer App Android", platform: "android" },
  { id: "loyalty_beta", name: "Pranaglow Beta App iOS", platform: "ios" },
  { id: "checkout_flow_android", name: "Pranaglow Staging App Android", platform: "android" },
  { id: "pranaglow_beta_android", name: "Pranaglow Beta App Android", platform: "android" },
];
