import { MySQL } from '../mysql/MySql';
import { BCrypt } from './BCrypt';
import { User } from './User';

export class Authentication {
    public static async register(name: string, password: string, email: string): Promise<User | undefined> {
        try {
            if (await Authentication.userExists(name, email)) return Authentication.login(name, password);

            await MySQL.queryWithTransaction('INSERT INTO user(name, email, password) VALUES(?, ?, ?)', [name, email, await BCrypt.hash(password)]);

            const result = await MySQL.query('SELECT id FROM user WHERE name=?', [name]);

            await MySQL.queryWithTransaction('INSERT INTO avatar(userId, level, topicBlockId) VALUES(?, 0, 1)', [result[0].id]);
            await MySQL.queryWithTransaction('INSERT INTO avatar(userId, level, topicBlockId) VALUES(?, 0, 2)', [result[0].id]);
            await MySQL.queryWithTransaction('INSERT INTO avatar(userId, level, topicBlockId) VALUES(?, 0, 3)', [result[0].id]);

            return await Authentication.login(name, password);
        }
        catch (error) {
            console.error(error);
            return undefined;
        }
    }
    public static async login(name: string, password: string): Promise<User | undefined> {
        try {
            const result = await MySQL.query('SELECT * FROM user WHERE name=?', [name]);
            console.log(result);
            if (!result[0].password) throw 'no password';

            if (await BCrypt.match(password, result[0].password)) return new User(result[0].id, result[0].name, result[0].email, result[0].progress);
        }
        catch (error) {
            console.error(error);
            return undefined;
        }
    }
    public static async userExists(name: string, email: string): Promise<boolean> {
        try {
            const result = await MySQL.query('SELECT * FROM user WHERE name=? OR email=?', [name, email]);
            return result.length !== 0;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }
}