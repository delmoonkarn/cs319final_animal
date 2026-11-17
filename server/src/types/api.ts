/**
 * Shapes shared by several API responses. Dates are Date objects here and arrive in the
 * client as ISO strings (e.g. "2026-11-17T10:00:00.000Z").
 */

/** A stored image: the full-size URL (what the database keeps) + its thumbnail URL. */
export type ImageDto = {
  url: string;
  /** 400px wide version for cards; same as `url` for external placeholder images */
  thumbUrl: string;
};

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/** Response of list endpoints: `{ data: [...], pagination: {...} }` */
export type Paginated<T> = {
  data: T[];
  pagination: Pagination;
};
