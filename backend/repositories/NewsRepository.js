import Repository from "../Repository.js";

class NewsRepository extends Repository {
    constructor(dbManager) {
        super(dbManager, "news");
    }

    findPublished() {
        return this.findWhere((n) => n.status === "published");
    }

    findLatest(limit = 10) {
        return this.findPublished()
            .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt))
            .slice(0, limit);
    }

    findByCategory(category) {
        return this.findPublished().filter((n) => n.category === category);
    }
}

export default NewsRepository;
