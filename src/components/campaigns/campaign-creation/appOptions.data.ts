export interface AppOption {
  id: string;
  name: string;
  platform: "ios" | "android";
}

/** Registered apps/assets a push send can target — shared by the audience
 *  step's "Select app(s)" field and the assets step's "Select asset(s)"
 *  field, since both pick from the same registered-app list. */
export const APP_OPTIONS: AppOption[] = [
  { id: "testing", name: "testing", platform: "ios" },
  { id: "neww_1", name: "neww_1", platform: "ios" },
  { id: "qa_test_1", name: "qa_test 1", platform: "ios" },
  { id: "testing_android_app", name: "TestingAndroidApp", platform: "android" },
  { id: "app_save_1", name: "app_save_1", platform: "ios" },
  { id: "set_ip_save", name: "set_ip_save", platform: "ios" },
  { id: "cart_recovery_android", name: "CartRecoveryApp", platform: "android" },
  { id: "loyalty_beta", name: "loyalty_beta", platform: "ios" },
  { id: "checkout_flow_android", name: "CheckoutFlowApp", platform: "android" },
];
