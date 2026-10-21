import React from 'react';

/** SMS channel glyph (ia-sms) — stroke-based, uses currentColor so it matches
 *  whatever text color the channel icon slot is given. */
export const SmsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M15.5 7.67504C15.5 11.6374 12.1417 14.8501 8 14.8501C7.51301 14.8507 7.02743 14.8057 6.54906 14.7158C6.20474 14.6512 6.03259 14.6188 5.9124 14.6372C5.79221 14.6556 5.62188 14.7461 5.28124 14.9273C4.3176 15.4398 3.19396 15.6207 2.11333 15.4197C2.52406 14.9145 2.80456 14.3084 2.92833 13.6586C3.00333 13.2611 2.8175 12.875 2.53917 12.5923C1.275 11.3086 0.5 9.57881 0.5 7.67504C0.5 3.71268 3.85833 0.5 8 0.5C12.1417 0.5 15.5 3.71268 15.5 7.67504Z"
      stroke="currentColor"
      strokeLinejoin="round"
    />
    <path
      d="M7.99664 8H8.00336M10.9933 8H11M5 8H5.00673"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default SmsIcon;
