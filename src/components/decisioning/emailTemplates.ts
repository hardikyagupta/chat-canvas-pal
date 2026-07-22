/**
 * Shared email-template registry — the single source of truth for the 8 real
 * HTML email templates used across the decisioning flow.
 *
 * Each template is a full Unlayer email exported to
 * `public/email-templates/<folder>/index.html` (with a co-located `images/`
 * folder). Vite serves `public/` at the web root, so `src` is a URL an
 * <iframe> can load directly. The numeric IDs match the IDs already threaded
 * through the flow (CHANNEL_POOL, overrides, etc.); the folder slug lives only
 * inside `src`.
 */

export type EmailTemplate = {
  id: string;
  name: string;
  type: string;
  /** Public URL of the template's index.html, for an <iframe src>. */
  src: string;
};

const asset = (folder: string) => `/email-templates/${folder}/index.html`;

export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  "912": {
    id: "912",
    name: "Women's Day Special",
    type: "Marketing",
    src: asset("1784712844252-HfVOBLxtcUPdZ9fx"),
  },
  "868": {
    id: "868",
    name: "New Year Party",
    type: "Marketing",
    src: asset("1784712955374-rv2JGTntswLSIJaP"),
  },
  "664": {
    id: "664",
    name: "Valentine's Day",
    type: "Marketing",
    src: asset("1784712926397-H0LDi35o13YDZcbN"),
  },
  "337": {
    id: "337",
    name: "Holiday Decor Sale",
    type: "Marketing",
    src: asset("1784713082319-rRLiiH4jUR4LWb4J"),
  },
  "774": {
    id: "774",
    name: "Christmas Collections",
    type: "Marketing",
    src: asset("1784713070788-hYfNJ0aGAIHeHskK"),
  },
  "742": {
    id: "742",
    name: "Loan Application Update",
    type: "Transactional",
    src: asset("1784712987252-pbi3lNKUczI6oSN9"),
  },
  "915": {
    id: "915",
    name: "Awareness Campaign",
    type: "Marketing",
    src: asset("1784712939514-DYdUCd2OfAxlzp9p"),
  },
  "603": {
    id: "603",
    name: "Monthly Newsletter",
    type: "Marketing",
    src: asset("1784712915950-PPIVpQQoRYHS54kQ"),
  },
};

export const getTemplate = (id: string): EmailTemplate | undefined =>
  EMAIL_TEMPLATES[id];

/** Public URL of a template's HTML, or undefined for an unknown id. */
export const templateSrc = (id?: string | null): string | undefined =>
  id ? EMAIL_TEMPLATES[id]?.src : undefined;
