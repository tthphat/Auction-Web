import expressHandlebarsSections from "express-handlebars-sections";

/**
 * Extract date/time parts from a Date object.
 * Reusable helper to avoid repeating the same parsing logic (DRY).
 */
function extractDateParts(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return {
    year: d.getFullYear(),
    month: String(d.getMonth() + 1).padStart(2, "0"),
    day: String(d.getDate()).padStart(2, "0"),
    hour: String(d.getHours()).padStart(2, "0"),
    minute: String(d.getMinutes()).padStart(2, "0"),
    second: String(d.getSeconds()).padStart(2, "0"),
  };
}

const helpers = {
  // ============================================================
  // Layout
  // ============================================================
  section: expressHandlebarsSections(),

  // ============================================================
  // Comparison Helpers
  // ============================================================
  eq(a, b) {
    return a === b;
  },
  ne(a, b) {
    return a !== b;
  },
  gt(a, b) {
    return a > b;
  },
  gte(a, b) {
    return a >= b;
  },
  lt(a, b) {
    return a < b;
  },
  lte(a, b) {
    return a <= b;
  },
  and(...args) {
    return args.slice(0, -1).every(Boolean);
  },
  or(...args) {
    return args.slice(0, -1).some(Boolean);
  },

  // ============================================================
  // Arithmetic Helpers
  // ============================================================
  add(a, b) {
    return a + b;
  },
  subtract(a, b) {
    return a - b;
  },
  multiply(a, b) {
    return a * b;
  },
  round(value, decimals) {
    return (
      Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
    );
  },

  // ============================================================
  // String / Array Helpers
  // ============================================================
  truncate(str, len) {
    if (!str) return "";
    if (str.length <= len) return str;
    return str.substring(0, len) + "...";
  },
  replace(str, search, replaceWith) {
    if (!str) return "";
    return str.replace(new RegExp(search, "g"), replaceWith);
  },
  length(arr) {
    return Array.isArray(arr) ? arr.length : 0;
  },
  range(start, end) {
    const result = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  },

  // ============================================================
  // Formatting Helpers
  // ============================================================
  format_number(price) {
    return new Intl.NumberFormat("en-US").format(price);
  },

  mask_name(fullname) {
    if (!fullname) return null;
    const name = fullname.trim();
    if (name.length === 0) return null;
    if (name.length === 1) return "*";
    if (name.length === 2) return name[0] + "*";

    let masked = "";
    for (let i = 0; i < name.length; i++) {
      masked += i % 2 === 0 ? name[i] : "*";
    }
    return masked;
  },

  format_date(date) {
    if (!date) return "";
    const parts = extractDateParts(date);
    if (!parts) return "";
    return `${parts.hour}:${parts.minute}:${parts.second} ${parts.day}/${parts.month}/${parts.year}`;
  },

  format_only_date(date) {
    if (!date) return "";
    const parts = extractDateParts(date);
    if (!parts) return "";
    return `${parts.day}/${parts.month}/${parts.year}`;
  },

  format_only_time(time) {
    if (!time) return "";
    const parts = extractDateParts(time);
    if (!parts) return "";
    return `${parts.hour}:${parts.minute}:${parts.second}`;
  },

  format_date_input(date) {
    if (!date) return "";
    const parts = extractDateParts(date);
    if (!parts) return "";
    return `${parts.year}-${parts.month}-${parts.day}`;
  },

  // ============================================================
  // Auction Time Helpers
  // ============================================================
  time_remaining(date) {
    const now = new Date();
    const end = new Date(date);
    const diff = end - now;
    if (diff <= 0) return "00:00:00";
    const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
    const minutes = String(
      Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    ).padStart(2, "0");
    const seconds = String(
      Math.floor((diff % (1000 * 60)) / 1000)
    ).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  },

  format_time_remaining(date) {
    const now = new Date();
    const end = new Date(date);
    const diff = end - now;

    if (diff <= 0) return "Auction Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // > 3 days: show absolute end date
    if (days > 3) {
      const parts = extractDateParts(end);
      if (!parts) return "";
      return `${parts.hour}:${parts.minute}:${parts.second} ${parts.day}/${parts.month}/${parts.year}`;
    }

    // <= 3 days: show relative time
    if (days >= 1) return `${days} days left`;
    if (hours >= 1) return `${hours} hours left`;
    if (minutes >= 1) return `${minutes} minutes left`;
    return `${seconds} seconds left`;
  },

  should_show_relative_time(date) {
    const now = new Date();
    const end = new Date(date);
    const diff = end - now;

    if (diff <= 0) return true;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days <= 3;
  },

  // ============================================================
  // Pagination Helper
  // ============================================================
  getPaginationRange(currentPage, totalPages) {
    const range = [];
    const maxVisible = 4;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++)
        range.push({ number: i, type: "number" });
    } else {
      range.push({ number: 1, type: "number" });
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (start > 2) range.push({ type: "ellipsis" });
      for (let i = start; i <= end; i++)
        range.push({ number: i, type: "number" });
      if (end < totalPages - 1) range.push({ type: "ellipsis" });
      range.push({ number: totalPages, type: "number" });
    }
    return range;
  },
};

export default helpers;
