import { randomBytes } from "node:crypto";
import type { DocumentData, Firestore, Query } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db as getDb } from "@/lib/firebase-admin";

export function newId(): string {
  return randomBytes(12).toString("base64url");
}

export function toDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object" && value !== null && "toDate" in value) {
    try {
      return (value as Timestamp).toDate();
    } catch {
      return null;
    }
  }
  return null;
}

export function requireDate(value: unknown, fallback = new Date()): Date {
  return toDate(value) ?? fallback;
}

/** Convert plain JS values for Firestore writes (Dates → Timestamp, strip undefined). */
export function serialize(data: Record<string, unknown>): DocumentData {
  const out: DocumentData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value instanceof Date) {
      out[key] = Timestamp.fromDate(value);
    } else if (value === null || typeof value !== "object") {
      out[key] = value;
    } else if (Array.isArray(value)) {
      out[key] = value.map((item) =>
        item instanceof Date
          ? Timestamp.fromDate(item)
          : item && typeof item === "object" && !Array.isArray(item)
            ? serialize(item as Record<string, unknown>)
            : item,
      );
    } else {
      out[key] = serialize(value as Record<string, unknown>);
    }
  }
  return out;
}

type WhereFilter =
  | { [field: string]: unknown }
  | {
      [field: string]: {
        in?: unknown[];
        gte?: Date | number | string;
        lte?: Date | number | string;
        not?: unknown;
        contains?: string;
        mode?: string;
      };
    };

/**
 * Extract Firestore-friendly equality / `in` clauses from a Prisma-style where.
 * Returns null when the filter needs a full collection scan (OR/AND/ops we can't push down).
 */
function firestoreEqualityFilters(
  where?: WhereFilter,
): Array<{ field: string; op: "==" | "in"; value: unknown }> | null {
  if (!where) return [];
  const record = where as Record<string, unknown>;
  if (record.OR != null || record.AND != null) return null;

  const out: Array<{ field: string; op: "==" | "in"; value: unknown }> = [];
  for (const [field, condition] of Object.entries(where)) {
    if (
      condition !== null &&
      typeof condition === "object" &&
      !Array.isArray(condition) &&
      !(condition instanceof Date)
    ) {
      const c = condition as Record<string, unknown>;
      if ("in" in c && Array.isArray(c.in) && c.in.length > 0 && c.in.length <= 30) {
        const extras = Object.keys(c).filter((k) => k !== "in");
        if (extras.length > 0) return null;
        out.push({ field, op: "in", value: c.in });
        continue;
      }
      return null;
    }
    out.push({ field, op: "==", value: condition });
  }
  return out;
}

function matchWhere(doc: Record<string, unknown>, where?: WhereFilter): boolean {
  if (!where) return true;
  const record = where as Record<string, unknown>;
  if (Array.isArray(record.OR)) {
    return (record.OR as WhereFilter[]).some((clause) => matchWhere(doc, clause));
  }
  if (Array.isArray(record.AND)) {
    return (record.AND as WhereFilter[]).every((clause) => matchWhere(doc, clause));
  }
  for (const [field, condition] of Object.entries(where)) {
    if (field === "OR" || field === "AND") continue;
    const value = doc[field];
    if (
      condition !== null &&
      typeof condition === "object" &&
      !Array.isArray(condition) &&
      !(condition instanceof Date)
    ) {
      const c = condition as Record<string, unknown>;
      if ("in" in c && Array.isArray(c.in)) {
        if (!c.in.includes(value)) return false;
      }
      if ("not" in c) {
        if (value === c.not) return false;
      }
      if ("gte" in c) {
        const left =
          value instanceof Date
            ? value.getTime()
            : typeof value === "number"
              ? value
              : new Date(String(value)).getTime();
        const right =
          c.gte instanceof Date ? c.gte.getTime() : new Date(String(c.gte)).getTime();
        if (!(left >= right)) return false;
      }
      if ("lte" in c) {
        const left =
          value instanceof Date
            ? value.getTime()
            : typeof value === "number"
              ? value
              : new Date(String(value)).getTime();
        const right =
          c.lte instanceof Date ? c.lte.getTime() : new Date(String(c.lte)).getTime();
        if (!(left <= right)) return false;
      }
      if ("contains" in c && typeof c.contains === "string") {
        const hay = String(value ?? "").toLowerCase();
        const needle = c.contains.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      continue;
    } else if (value !== condition) {
      return false;
    }
  }
  return true;
}

function sortRows<T extends Record<string, unknown>>(
  rows: T[],
  orderBy?: Record<string, "asc" | "desc"> | Array<Record<string, "asc" | "desc">>,
): T[] {
  if (!orderBy) return rows;
  const clauses = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...rows].sort((a, b) => {
    for (const clause of clauses) {
      const [field, dir] = Object.entries(clause)[0] ?? [];
      if (!field) continue;
      const av = a[field];
      const bv = b[field];
      let cmp = 0;
      if (av instanceof Date && bv instanceof Date) cmp = av.getTime() - bv.getTime();
      else if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av ?? "").localeCompare(String(bv ?? ""));
      if (cmp !== 0) return dir === "desc" ? -cmp : cmp;
    }
    return 0;
  });
}

/** Loose document shape returned by Firestore delegates (includes/select vary per call). */
// Prisma-compatible facade uses flexible documents; callers cast when needed.
export type LooseDoc = Record<string, unknown> & { id?: string };

/* eslint-disable @typescript-eslint/no-explicit-any -- facade mirrors Prisma's flexible include/select payloads */
export type CollectionDelegate = {
  findMany: (args?: {
    where?: WhereFilter;
    orderBy?: Record<string, "asc" | "desc"> | Array<Record<string, "asc" | "desc">>;
    take?: number;
    skip?: number;
    select?: Record<string, boolean | object>;
    include?: Record<string, unknown>;
  }) => Promise<any[]>;
  findUnique: (args: {
    where: Record<string, unknown>;
    select?: Record<string, boolean | object>;
    include?: Record<string, unknown>;
  }) => Promise<any | null>;
  findFirst: (args?: {
    where?: WhereFilter;
    orderBy?: Record<string, "asc" | "desc"> | Array<Record<string, "asc" | "desc">>;
    take?: number;
    select?: Record<string, boolean | object>;
    include?: Record<string, unknown>;
  }) => Promise<any | null>;
  create: (args: {
    data: Record<string, unknown>;
    select?: Record<string, boolean | object>;
    include?: Record<string, unknown>;
  }) => Promise<any>;
  update: (args: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
    select?: Record<string, boolean | object>;
    include?: Record<string, unknown>;
  }) => Promise<any>;
  upsert: (args: {
    where: Record<string, unknown>;
    create: Record<string, unknown>;
    update: Record<string, unknown>;
  }) => Promise<any>;
  delete: (args: { where: Record<string, unknown> }) => Promise<any>;
  deleteMany: (args?: { where?: WhereFilter }) => Promise<{ count: number }>;
  updateMany: (args: {
    where?: WhereFilter;
    data: Record<string, unknown>;
  }) => Promise<{ count: number }>;
  count: (args?: { where?: WhereFilter }) => Promise<number>;
  aggregate: (args?: {
    where?: WhereFilter;
    _max?: Record<string, boolean>;
    _sum?: Record<string, boolean>;
    _count?: boolean | Record<string, boolean>;
  }) => Promise<any>;
  groupBy: (args: {
    by: string[];
    where?: WhereFilter;
    _count?: boolean | { _all?: boolean; [k: string]: boolean | undefined };
  }) => Promise<any[]>;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

type HydrateFn<T> = (id: string, data: DocumentData) => T;

export function createCollection<T extends { id: string }>(
  name: string,
  hydrate: HydrateFn<T>,
  options?: {
    /** Unique field names that map to doc lookups via secondary index docs */
    uniqueFields?: string[];
    include?: (
      row: T,
      include: Record<string, unknown>,
      firestore: Firestore,
    ) => Promise<T>;
    dateFields?: string[];
  },
): CollectionDelegate {
  const dateFields = new Set(options?.dateFields ?? ["createdAt", "updatedAt"]);

  async function fs() {
    return getDb();
  }

  async function loadAll(): Promise<T[]> {
    const firestore = await fs();
    const snap = await firestore.collection(name).get();
    return snap.docs.map((doc) => hydrate(doc.id, doc.data()));
  }

  /** Prefer indexed Firestore queries; fall back to full scan on complex filters / missing indexes. */
  async function loadMatching(where?: WhereFilter): Promise<T[]> {
    const filters = firestoreEqualityFilters(where);
    if (filters === null) {
      const all = await loadAll();
      return all.filter((r) => matchWhere(r as unknown as Record<string, unknown>, where));
    }
    if (filters.length === 0) return loadAll();

    try {
      const firestore = await fs();
      let query: Query = firestore.collection(name);
      for (const f of filters) {
        query = query.where(f.field, f.op, f.value);
      }
      const snap = await query.get();
      return snap.docs.map((doc) => hydrate(doc.id, doc.data()));
    } catch (error) {
      console.warn(`[firestore] ${name} query failed, falling back to full scan:`, error);
      const all = await loadAll();
      return all.filter((r) => matchWhere(r as unknown as Record<string, unknown>, where));
    }
  }

  async function resolveWhereId(where: Record<string, unknown>): Promise<string | null> {
    if (typeof where.id === "string") return where.id;
    const firestore = await fs();
    for (const field of options?.uniqueFields ?? []) {
      if (where[field] != null) {
        const snap = await firestore
          .collection(name)
          .where(field, "==", where[field])
          .limit(1)
          .get();
        if (!snap.empty) return snap.docs[0].id;
      }
    }
    const all = await loadAll();
    const hit = all.find((row) => matchWhere(row as unknown as Record<string, unknown>, where));
    return hit?.id ?? null;
  }

  async function applyInclude(row: T, include?: Record<string, unknown>): Promise<T> {
    if (!include || !options?.include) return row;
    const firestore = await fs();
    return options.include(row, include, firestore);
  }

  function pickSelect(row: T, select?: Record<string, boolean>): T {
    if (!select) return row;
    const out: Record<string, unknown> = { id: row.id };
    for (const [key, on] of Object.entries(select)) {
      if (on) out[key] = (row as Record<string, unknown>)[key];
    }
    return out as T;
  }

  return {
    async findMany(args = {}) {
      let rows = await loadMatching(args.where);
      rows = sortRows(rows as unknown as Record<string, unknown>[], args.orderBy) as T[];
      if (args.skip) rows = rows.slice(args.skip);
      if (args.take != null) rows = rows.slice(0, args.take);
      const withInclude = await Promise.all(rows.map((r) => applyInclude(r, args.include)));
      return withInclude.map((r) =>
        pickSelect(r, args.select as Record<string, boolean> | undefined),
      );
    },

    async findUnique(args) {
      const id = await resolveWhereId(args.where);
      if (!id) return null;
      const firestore = await fs();
      const snap = await firestore.collection(name).doc(id).get();
      if (!snap.exists) return null;
      let row = hydrate(snap.id, snap.data()!);
      row = await applyInclude(row, args.include);
      return pickSelect(row, args.select as Record<string, boolean> | undefined);
    },

    async findFirst(args = {}) {
      const rows = await this.findMany({
        where: args.where,
        orderBy: args.orderBy,
        take: 1,
        include: args.include,
        select: args.select,
      });
      return rows[0] ?? null;
    },

    async update(args) {
      const id = await resolveWhereId(args.where);
      if (!id) throw new Error(`${name} not found`);
      const firestore = await fs();
      const ref = firestore.collection(name).doc(id);
      const data = { ...args.data };
      if (dateFields.has("updatedAt") && data.updatedAt == null) {
        data.updatedAt = new Date();
      }

      const historyCreate = (data as { statusHistory?: { create?: unknown } }).statusHistory;
      delete (data as { statusHistory?: unknown }).statusHistory;

      await ref.set(serialize(data), { merge: true });

      if (historyCreate?.create) {
        const entries = Array.isArray(historyCreate.create)
          ? historyCreate.create
          : [historyCreate.create];
        const batch = firestore.batch();
        const now = new Date();
        for (const entry of entries) {
          const entryData = entry as Record<string, unknown>;
          const entryId = newId();
          if (entryData.createdAt == null) entryData.createdAt = now;
          batch.set(
            firestore.collection("orderStatusHistory").doc(entryId),
            serialize({ ...entryData, id: entryId, orderId: id }),
          );
        }
        await batch.commit();
      }

      const snap = await ref.get();
      let row = hydrate(snap.id, snap.data()!);
      if (args.include || historyCreate) {
        row = await applyInclude(row, args.include ?? { items: true, statusHistory: true });
      }
      return pickSelect(row, args.select as Record<string, boolean> | undefined);
    },

    async create(args) {
      const firestore = await fs();
      const now = new Date();
      const data = { ...args.data };
      const nestedCreates = data as Record<string, unknown>;

      // Prisma-style nested creates on orders: items/create, statusHistory/create
      const itemsCreate = nestedCreates.items as { create?: unknown } | undefined;
      const historyCreate = nestedCreates.statusHistory as { create?: unknown } | undefined;
      delete nestedCreates.items;
      delete nestedCreates.statusHistory;

      const id =
        typeof data.id === "string" && data.id ? (data.id as string) : newId();
      delete data.id;

      if (dateFields.has("createdAt") && data.createdAt == null) data.createdAt = now;
      if (dateFields.has("updatedAt") && data.updatedAt == null) data.updatedAt = now;

      const ref = firestore.collection(name).doc(id);
      await ref.set(serialize({ ...data, id }));

      if (itemsCreate?.create) {
        const lines = Array.isArray(itemsCreate.create)
          ? itemsCreate.create
          : [itemsCreate.create];
        const batch = firestore.batch();
        for (const line of lines) {
          const lineData = line as Record<string, unknown>;
          const lineId =
            typeof lineData.id === "string" && lineData.id
              ? lineData.id
              : newId();
          delete lineData.id;
          const lineRef = firestore.collection("orderItems").doc(lineId);
          batch.set(
            lineRef,
            serialize({ ...lineData, id: lineId, orderId: id }),
          );
        }
        await batch.commit();
      }

      if (historyCreate?.create) {
        const entries = Array.isArray(historyCreate.create)
          ? historyCreate.create
          : [historyCreate.create];
        const batch = firestore.batch();
        for (const entry of entries) {
          const entryData = entry as Record<string, unknown>;
          const entryId =
            typeof entryData.id === "string" && entryData.id
              ? entryData.id
              : newId();
          delete entryData.id;
          if (entryData.createdAt == null) entryData.createdAt = now;
          const entryRef = firestore.collection("orderStatusHistory").doc(entryId);
          batch.set(
            entryRef,
            serialize({ ...entryData, id: entryId, orderId: id }),
          );
        }
        await batch.commit();
      }

      const snap = await ref.get();
      let row = hydrate(snap.id, snap.data()!);
      if (args.include) {
        row = await applyInclude(row, args.include);
      }
      return pickSelect(row, args.select as Record<string, boolean> | undefined);
    },

    async upsert(args) {
      const existing = await this.findUnique({ where: args.where });
      if (existing) {
        return this.update({ where: args.where, data: args.update });
      }
      const createData = { ...args.create };
      for (const [k, v] of Object.entries(args.where)) {
        if (createData[k] == null) createData[k] = v;
      }
      if (typeof args.where.id === "string") createData.id = args.where.id;
      return this.create({ data: createData });
    },

    async delete(args) {
      const id = await resolveWhereId(args.where);
      if (!id) throw new Error(`${name} not found`);
      const firestore = await fs();
      const ref = firestore.collection(name).doc(id);
      const snap = await ref.get();
      if (!snap.exists) throw new Error(`${name} not found`);
      const row = hydrate(snap.id, snap.data()!);
      await ref.delete();

      // Cascade order children
      if (name === "orders") {
        const items = await firestore.collection("orderItems").where("orderId", "==", id).get();
        const hist = await firestore
          .collection("orderStatusHistory")
          .where("orderId", "==", id)
          .get();
        const batch = firestore.batch();
        items.docs.forEach((d) => batch.delete(d.ref));
        hist.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }

      return row;
    },

    async deleteMany(args = {}) {
      const rows = await this.findMany({ where: args.where });
      const firestore = await fs();
      let count = 0;
      for (const chunk of chunkArray(rows, 400)) {
        const batch = firestore.batch();
        for (const row of chunk) {
          batch.delete(firestore.collection(name).doc(row.id));
          count += 1;
        }
        await batch.commit();
      }
      return { count };
    },

    async updateMany(args) {
      const rows = await this.findMany({ where: args.where });
      const firestore = await fs();
      let count = 0;
      const data = { ...args.data, updatedAt: new Date() };
      for (const chunk of chunkArray(rows, 400)) {
        const batch = firestore.batch();
        for (const row of chunk) {
          batch.set(firestore.collection(name).doc(row.id), serialize(data), {
            merge: true,
          });
          count += 1;
        }
        await batch.commit();
      }
      return { count };
    },

    async count(args = {}) {
      const rows = await this.findMany({ where: args.where });
      return rows.length;
    },

    async aggregate(args = {}) {
      const rows = await this.findMany({ where: args.where });
      const result: Record<string, unknown> = {};
      if (args._max) {
        const maxOut: Record<string, unknown> = {};
        for (const field of Object.keys(args._max)) {
          let max: number | null = null;
          for (const row of rows) {
            const v = (row as Record<string, unknown>)[field];
            if (typeof v === "number" && (max == null || v > max)) max = v;
          }
          maxOut[field] = max;
        }
        result._max = maxOut;
      }
      if (args._sum) {
        const sumOut: Record<string, unknown> = {};
        for (const field of Object.keys(args._sum)) {
          let sum = 0;
          for (const row of rows) {
            const v = (row as Record<string, unknown>)[field];
            if (typeof v === "number") sum += v;
          }
          sumOut[field] = sum;
        }
        result._sum = sumOut;
      }
      if (args._count) {
        result._count = rows.length;
      }
      return result;
    },

    async groupBy(args) {
      const rows = await this.findMany({ where: args.where });
      const map = new Map<string, Record<string, unknown>>();
      for (const row of rows) {
        const key = args.by.map((f) => String((row as Record<string, unknown>)[f])).join("\0");
        let entry = map.get(key);
        if (!entry) {
          entry = {};
          for (const f of args.by) entry[f] = (row as Record<string, unknown>)[f];
          entry._count = { _all: 0 };
          map.set(key, entry);
        }
        const count = entry._count as { _all: number };
        count._all += 1;
      }
      return [...map.values()];
    },
  };
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export { FieldValue };
