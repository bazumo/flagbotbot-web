import { User } from 'discord.js';
import { Database } from 'sqlite';

// TODO sync this with bot


export class DB {

    private db: Database;

    constructor(db: Database) {
        this.db = db;
    }

    async createTables() {
        await this.db.run(`
        CREATE TABLE IF NOT EXISTS challenges
        (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           name TEXT,
           description TEXT,
           category TEXT,
           flag TEXT
       );`)





        await this.db.run(`
       CREATE TABLE IF NOT EXISTS solves
       (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          challenge_id INTEGER,
          date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (challenge_id) REFERENCES challenges(id)
      )`);

        await this.db.run(`
      CREATE TABLE IF NOT EXISTS users
            (
                id INTEGER PRIMARY KEY,
                name TEXT
            );


        `);
    }

    async createChallenge(name: string, description: string, category: string, flag: string) {
        return this.db.run("INSERT INTO challenges (name, description, category, flag) VALUES (?, ?, ?, ?)", [name, description, category, flag]);
    }

    async updateChallenge(id: number, name: string, description: string, category: string, flag: string) {
        return this.db.run("UPDATE challenges SET name = ?, description = ?, category = ?, flag = ? WHERE id = ?", [name, description, category, flag, id]);
    }

    async ensureUser(user: User) {
        return this.db.run("INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)", [user.id, user.username]);
    }

    async hasSolve(user: User, flag: string) {
        const solve = await this.db.get("SELECT * FROM solves JOIN challenges ON solves.challenge_id = challenges.id WHERE user_id = ? AND flag = ?", [user.id, flag]);
        return solve !== undefined;
    }

    async getChallengeByFlag(flag: string) {
        const solve = await this.db.get("SELECT * FROM challenges WHERE flag = ?", [flag]);
        return solve;
    }

    async createSolve(user: User, flag: string) {
        await this.ensureUser(user);
        const challenge = await this.getChallengeByFlag(flag);
        if (challenge) {
            await this.db.run("INSERT INTO solves (user_id, challenge_id) VALUES (?, ?)", [user.id, challenge.id]);
            return challenge;
        }
    }

    async getChallenges() {
        return this.db.all("SELECT * FROM challenges");
    }

    async getChallenge(id: number) {
        return this.db.get("SELECT * FROM challenges WHERE id = ?", [id]);
    }

    async getChallengesByCategory(cat: string) {
        return this.db.all("SELECT * FROM challenges WHERE category = ?", [cat]);
    }

    async getRecentSolves() {
        return this.db.all("SELECT users.name as user_name, users.id as user_id, challenges.id as challenge_id, challenges.name as challenge_name, date FROM solves JOIN challenges ON solves.challenge_id = challenges.id JOIN users ON solves.user_id = users.id ORDER BY date DESC LIMIT 10");
    }

    async getSolves() {
        return this.db.all("SELECT users.name as user_name, users.id as user_id, challenges.id as challenge_id, challenges.name as challenge_name, date FROM solves JOIN challenges ON solves.challenge_id = challenges.id JOIN users ON solves.user_id = users.id");
    }

    async getSolvesByChallengeId(id: number) {
        return this.db.all("SELECT users.name as user_name, users.id as user_id, challenges.id as challenge_id, challenges.name as challenge_name, date FROM solves JOIN challenges ON solves.challenge_id = challenges.id JOIN users ON solves.user_id = users.id WHERE challenge_id = ?", [id]);
    }

}