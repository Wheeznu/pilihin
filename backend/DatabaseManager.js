class DatabaseManager {
    constructor(dbName = "pilih-in-db") {
        this.dbName = dbName;
        this._initIfEmpty();
    }

    _initIfEmpty() {
        if (!localStorage.getItem(this.dbName)) {
            localStorage.setItem(
                this.dbName,
                JSON.stringify(this._defaultDb()),
            );
        }
    }

    getDatabase() {
        try {
            return (
                JSON.parse(localStorage.getItem(this.dbName)) ||
                this._defaultDb()
            );
        } catch {
            return this._defaultDb();
        }
    }

    saveDatabase(db) {
        try {
            localStorage.setItem(this.dbName, JSON.stringify(db));
            return true;
        } catch (err) {
            if (err.name === "QuotaExceededError")
                console.warn("localStorage penuh!");
            return false;
        }
    }

    getCollection(name) {
        return this.getDatabase()[name] || [];
    }

    saveCollection(name, data) {
        const db = this.getDatabase();
        db[name] = data;
        return this.saveDatabase(db);
    }

    _defaultDb() {
        return {
            users: [],
            films: [],
            actors: [],
            directors: [],
            genres: [],
            articles: [],
            faqs: [],
            pricingTiers: [],
            promotions: [],
            reviews: [],
            transactions: [],
            favorites: [],
            watchLists: [],
            watchHistory: [],
            notifications: [],
            actorFavorites: [],
            directorFavorites: [],
            userPoints: [],
            metadata: {
                version: "1.0",
                lastInitialized: new Date().toISOString(),
            },
        };
    }
}

export default DatabaseManager;
