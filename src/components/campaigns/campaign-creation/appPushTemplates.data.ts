import thumbHerbalCreams from "/campaign-assets/template-thumbs/tpl-push-herbal-creams.png";
import thumbNightCare from "/campaign-assets/template-thumbs/tpl-push-night-care.png";
import thumbFlashSale from "/campaign-assets/template-thumbs/tpl-push-flash-sale.png";
import thumbBoatHeadphones from "/campaign-assets/template-thumbs/tpl-push-boat-headphones.png";
import herbalCreamsIosExpanded from "/campaign-assets/template-thumbs/tpl-push-herbal-creams-ios-expanded.png";
import herbalCreamsIosCollapsed from "/campaign-assets/template-thumbs/tpl-push-herbal-creams-ios-collapsed.png";
import herbalCreamsAndroidExpanded from "/campaign-assets/template-thumbs/tpl-push-herbal-creams-android-expanded.png";
import herbalCreamsAndroidCollapsed from "/campaign-assets/template-thumbs/tpl-push-herbal-creams-android-collapsed.png";
import thumbPriceDrop from "/campaign-assets/template-thumbs/tpl-push-price-drop.png";
import priceDropIosExpanded from "/campaign-assets/template-thumbs/tpl-push-price-drop-ios-expanded.png";
import priceDropIosCollapsed from "/campaign-assets/template-thumbs/tpl-push-price-drop-ios-collapsed.png";
import priceDropAndroidExpanded from "/campaign-assets/template-thumbs/tpl-push-price-drop-android-expanded.png";
import priceDropAndroidCollapsed from "/campaign-assets/template-thumbs/tpl-push-price-drop-android-collapsed.png";
import thumbCouponExpiry from "/campaign-assets/template-thumbs/tpl-push-coupon-expiry.png";
import couponExpiryIosExpanded from "/campaign-assets/template-thumbs/tpl-push-coupon-expiry-ios-expanded.png";
import couponExpiryIosCollapsed from "/campaign-assets/template-thumbs/tpl-push-coupon-expiry-ios-collapsed.png";
import couponExpiryAndroidExpanded from "/campaign-assets/template-thumbs/tpl-push-coupon-expiry-android-expanded.png";
import couponExpiryAndroidCollapsed from "/campaign-assets/template-thumbs/tpl-push-coupon-expiry-android-collapsed.png";
import type { EmailTemplate } from "./emailTemplates.data";

/** Templates the AI flow drafts for its prompts (see pushAIScenarios.data). */
export const PRICE_DROP_TEMPLATE_ID = 80005;
export const COUPON_EXPIRY_TEMPLATE_ID = 80006;

/**
 * Saved templates for App Push's own "Select a template" picker — the same
 * card shell email templates use (thumbnail, name, ID), just showing a push
 * notification on a phone instead of an email screenshot. `image` is a real
 * rendered mock of the notification (phone chrome included), same as how a
 * real account's saved templates carry a generated thumbnail.
 */
export const appPushTemplates: EmailTemplate[] = [
  {
    id: COUPON_EXPIRY_TEMPLATE_ID,
    name: "Coupon Expiry Reminder",
    preview: "push-timer",
    image: thumbCouponExpiry,
    aiGenerated: true,
    pushPreviews: {
      "ios-expanded": couponExpiryIosExpanded,
      "ios-collapsed": couponExpiryIosCollapsed,
      "android-expanded": couponExpiryAndroidExpanded,
      "android-collapsed": couponExpiryAndroidCollapsed,
    },
  },
  {
    id: PRICE_DROP_TEMPLATE_ID,
    name: "Price Drop Alert",
    preview: "none",
    image: thumbPriceDrop,
    aiGenerated: true,
    pushPreviews: {
      "ios-expanded": priceDropIosExpanded,
      "ios-collapsed": priceDropIosCollapsed,
      "android-expanded": priceDropAndroidExpanded,
      "android-collapsed": priceDropAndroidCollapsed,
    },
  },
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
