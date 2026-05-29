import Repository from "../Repository.js";

class FilmRepository extends Repository {
    constructor(dbManager) {
        super(dbManager, "films");
    }

    findPublished() {
        return this.findWhere((f) => f.status === "published");
    }

    findByGenre(genreId) {
        return this.findWhere((f) => f.genres.includes(genreId));
    }

    findByDirector(directorId) {
        return this.findWhere((f) => f.director === directorId);
    }

    findByActor(actorId) {
        return this.findWhere((f) => f.actors.includes(actorId));
    }

    findPopular(limit = 10) {
        return this.findPublished()
            .sort((a, b) => b.watchCount - a.watchCount)
            .slice(0, limit);
    }

    findLatest(limit = 10) {
        return this.findPublished()
            .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
            .slice(0, limit);
    }

    findTrending(limit = 10) {
        return this.findPublished()
            .sort(
                (a, b) =>
                    b.averageRating * 10 +
                    b.watchCount -
                    (a.averageRating * 10 + a.watchCount),
            )
            .slice(0, limit);
    }

    search(query) {
        return super.search(["title", "description"], query);
    }
}

export default FilmRepository;
