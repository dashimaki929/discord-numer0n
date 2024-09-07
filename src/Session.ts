import { User } from './User';

export class Session {
    hostUserId: string | undefined;
    userList: Array<User> = [];
}