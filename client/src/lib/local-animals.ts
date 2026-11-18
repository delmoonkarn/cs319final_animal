const ADDED_KEY = 'pawhome_admin_added_animals';
const OVERRIDES_KEY = 'pawhome_admin_animal_overrides';
const DELETED_KEY = 'pawhome_admin_deleted_animals';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {

  }
}

export function getAddedAnimals(): any[] {
  return readJson<any[]>(ADDED_KEY, []);
}

export function getAnimalOverrides(): Record<string, any> {
  return readJson<Record<string, any>>(OVERRIDES_KEY, {});
}

export function getDeletedAnimalIds(): string[] {
  return readJson<string[]>(DELETED_KEY, []);
}

export function addLocalAnimal(animal: any) {
  const list = getAddedAnimals();
  writeJson(ADDED_KEY, [animal, ...list]);
}

export function updateLocalAnimal(id: string | number, patch: Record<string, any>) {
  const strId = String(id);
  const added = getAddedAnimals();
  const inAdded = added.some((a) => String(a.id) === strId || String(a.key) === strId);
  if (inAdded) {
    writeJson(
      ADDED_KEY,
      added.map((a) => (String(a.id) === strId || String(a.key) === strId ? { ...a, ...patch } : a)),
    );
    return;
  }
  const overrides = getAnimalOverrides();
  overrides[strId] = { ...(overrides[strId] || {}), ...patch };
  writeJson(OVERRIDES_KEY, overrides);
}

export function deleteLocalAnimal(id: string | number) {
  const strId = String(id);
  const added = getAddedAnimals();
  if (added.some((a) => String(a.id) === strId || String(a.key) === strId)) {
    writeJson(
      ADDED_KEY,
      added.filter((a) => String(a.id) !== strId && String(a.key) !== strId),
    );
  }
  const deleted = new Set(getDeletedAnimalIds());
  deleted.add(strId);
  writeJson(DELETED_KEY, [...deleted]);
}

export function resetLocalAdminData() {
  try {
    localStorage.removeItem(ADDED_KEY);
    localStorage.removeItem(OVERRIDES_KEY);
    localStorage.removeItem(DELETED_KEY);
  } catch {
  }
}

export function mergeAnimalsWithAdminChanges(apiAnimals: any[]): any[] {
  const deleted = new Set(getDeletedAnimalIds());
  const overrides = getAnimalOverrides();
  const added = getAddedAnimals().filter(
    (a) => !deleted.has(String(a.id)) && !deleted.has(String(a.key)),
  );

  const addedIds = new Set(added.map((a) => String(a.id)));
  const mergedApi = (Array.isArray(apiAnimals) ? apiAnimals : [])
    .filter((a) => {
      const id = String(a.id ?? a.key);
      return !deleted.has(id) && !addedIds.has(id);
    })
    .map((a) => {
      const id = String(a.id ?? a.key);
      return overrides[id] ? { ...a, ...overrides[id] } : a;
    });

  return [...added, ...mergedApi];
}

export function findLocalOrOverrideAnimal(id: string | number, apiAnimal?: any): any {
  const strId = String(id);
  const deleted = new Set(getDeletedAnimalIds());
  if (deleted.has(strId)) return null;

  const added = getAddedAnimals().find((a) => String(a.id) === strId || String(a.key) === strId);
  if (added) return added;

  const overrides = getAnimalOverrides();
  if (apiAnimal) {
    return overrides[strId] ? { ...apiAnimal, ...overrides[strId] } : apiAnimal;
  }
  return null;
}
