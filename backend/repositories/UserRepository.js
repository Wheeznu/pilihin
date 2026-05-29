import Repository from "../Repository.js";

class UserRepository extends Repository {
    constructor(dbManager) {
        super(dbManager, "users");
    }

    findByEmail(email) {
        return this.findWhere((u) => u.email === email)[0] || null;
    }

    findByRole(role) {
        return this.findWhere((u) => u.role === role);
    }

    findActive() {
        return this.findWhere((u) => u.status === "active");
    }
}

export default UserRepository;
