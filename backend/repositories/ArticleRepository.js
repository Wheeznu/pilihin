import Repository from "../Repository.js";

class ArticleRepository extends Repository {
    constructor(dbManager) {
        super(dbManager, "articles");
    }

    findPublished() {
        return this.findWhere((a) => a.status === "published");
    }

    findLatest(limit = 10) {
        return this.findPublished()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }

    findByCategory(category) {
        return this.findPublished().filter((a) => a.category === category);
    }
}

export default ArticleRepository;
