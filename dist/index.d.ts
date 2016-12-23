export declare class RuleEngine {
    activeRules: any;
    rules: any;
    private static logger;
    constructor(rules?: any);
    init(): void;
    register(rules: any): void;
    sync(): void;
    findRules(filter?: any): any;
    turn(state: any, filter: any): void;
    prioritize(priority: any, filter: any): void;
    toJSON(): any;
    fromJSON(rules: any): void;
    execute(fact: any, cb: any): void;
}
