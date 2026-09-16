import thumbHerbalCreams from "/campaign-assets/template-thumbs/tpl-push-herbal-creams.png";
import thumbNightCare from "/campaign-assets/template-thumbs/tpl-push-night-care.png";
import thumbFlashSale from "/campaign-assets/template-thumbs/tpl-push-flash-sale.png";
import thumbBoatHeadphones from "/campaign-assets/template-thumbs/tpl-push-boat-headphones.png";
import herbalCreamsIosExpanded from "/campaign-assets/template-thumbs/tpl-push-herbal-creams-ios-expanded.png";
import herbalCreamsIosCollapsed from "/campaign-assets/template-thumbs/tpl-push-herbal-creams-ios-collapsed.png";
import herbalCreamsAndroidExpanded from "/campaign-assets/template-thumbs/tpl-push-herbal-creams-android-expanded.png";
import herbalCreamsAndroidCollapsed from "/campaign-assets/template-thumbs/tpl-push-herbal-creams-android-collapsed.png";
import type { EmailTemplate } from "./emailTemplates.data";

/**
 * Saved templates for App Push's own "Select a template" picker — the same
 * card shell email templates use (thumbnail, name, ID), just showing a push
 * notification on a phone instead of an email screenshot. `image` is a real
 * rendered mock of the notification (phone chrome included), same as how a
 * real account's saved templates carry a generated thumbnail.
 */
export const appPushTemplates: EmailTemplate[] = [
  {
    id: 80001,
    name: "Herbal Creams Offer",
    preview: "push-regular",
    image: thumbHerbalCreams,
    pushPreviews: {
      "ios-expanded": herbalCreamsIosExpanded,
      "ios-collapsed": herbalCreamsIosCollapsed,
      "android-expanded": herbalCreamsAndroidExpanded,
      "android-collapsed": herbalCreamsAndroidCollapsed,
    },
  },
  { id: 80002, name: "Night-Care Collection", preview: "push-carousel", image: thumbNightCare },
  { id: 80003, name: "Flash Sale Countdown", preview: "push-timer", image: thumbFlashSale },
  { id: 80004, name: "boAt Headphones Drop", preview: "none", image: thumbBoatHeadphones },
];
