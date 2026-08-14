export const PLACEHOLDER_PATTERN = /\[\[FACT_\d{3}\]\]/g;

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
  "Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug", "Sep", "Sept", "Oct", "Nov", "Dec",
];

export const ENTITY_STOP_WORDS = new Set([
  "A", "An", "The", "This", "That", "These", "Those", "After", "Before", "As", "At", "By",
  "For", "From", "In", "Into", "On", "Over", "Under", "With", "Without", "And", "But", "Or",
  "More", "Most", "Some", "Many", "New", "Latest", "Breaking", "Meanwhile", "However", "Today",
]);

export const ORGANIZATION_SUFFIXES = new Set([
  "Agency", "Association", "Bank", "Commission", "Committee", "Company", "Corp", "Corporation",
  "Council", "Department", "Group", "Inc", "Institute", "Ministry", "Organization", "University",
]);
