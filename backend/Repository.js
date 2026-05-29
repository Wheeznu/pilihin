class Repository {
    constructor(dbManager, collectionName) {
        this.db = dbManager;
        this.collection = collectionName;
    }

    _uuid() {
        return `${this.collection.slice(0, -1)}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    }

    create(data) {
        const items = this.db.getCollection(this.collection);
        const record = {
            id: this._uuid(),
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        items.push(record);
        this.db.saveCollection(this.collection, items);
        return record;
    }

    findById(id) {
        return (
            this.db.getCollection(this.collection).find((i) => i.id === id) ||
            null
        );
    }

    findAll() {
        return this.db.getCollection(this.collection);
    }

    findWhere(predicate) {
        return this.db.getCollection(this.collection).filter(predicate);
    }

    update(id, data) {
        const items = this.db.getCollection(this.collection);
        const idx = items.findIndex((i) => i.id === id);
        if (idx === -1)
            throw new Error(`${this.collection}#${id} tidak ditemukan`);
        items[idx] = {
            ...items[idx],
            ...data,
            updatedAt: new Date().toISOString(),
        };
        this.db.saveCollection(this.collection, items);
        return items[idx];
    }

    delete(id) {
        const items = this.db.getCollection(this.collection);
        const idx = items.findIndex((i) => i.id === id);
        if (idx === -1)
            throw new Error(`${this.collection}#${id} tidak ditemukan`);
        const [deleted] = items.splice(idx, 1);
        this.db.saveCollection(this.collection, items);
        return deleted;
    }

    count() {
        return this.db.getCollection(this.collection).length;
    }

    paginate(page = 1, perPage = 20) {
        const items = this.db.getCollection(this.collection);
        return {
            data: items.slice((page - 1) * perPage, page * perPage),
            total: items.length,
            page,
            totalPages: Math.ceil(items.length / perPage),
        };
    }

    search(fields, query) {
        if (!query) return this.findAll();
        const q = query.toLowerCase();
        return this.findWhere((item) =>
            fields.some((f) => String(item[f] || "").toLowerCase().includes(q)),
        );
    }
}

export default Repository;
