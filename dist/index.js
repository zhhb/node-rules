"use strict";
var _ = require("lodash");
var debug = require("debug");
var RuleEngine = (function () {
    function RuleEngine(rules) {
        this.init();
        if (typeof rules !== 'undefined') {
            this.register(rules);
        }
    }
    RuleEngine.prototype.init = function () {
        this.rules = [];
        this.activeRules = [];
    };
    RuleEngine.prototype.register = function (rules) {
        if (Array.isArray(rules)) {
            this.rules = this.rules.concat(rules);
        }
        else if (rules !== null && typeof rules === 'object') {
            this.rules.push(rules);
        }
        this.sync();
    };
    RuleEngine.prototype.sync = function () {
        this.activeRules = this.rules.filter(function (r) {
            if (typeof r.on === 'undefined') {
                r.on = true;
            }
            if (r.on === true) {
                return r;
            }
        });
        this.activeRules.sort(function (a, b) {
            if (a.priority && b.priority) {
                return b.priority - a.priority;
            }
            else {
                return 0;
            }
        });
    };
    RuleEngine.prototype.findRules = function (filter) {
        if (typeof filter === 'undefined') {
            return this.rules;
        }
        else {
            var find = _.matches(filter);
            return _.filter(this.rules, find);
        }
    };
    RuleEngine.prototype.turn = function (state, filter) {
        var _state = (['on', 'ON', 'On', 'oN'].indexOf(state) > -1) ? true : false;
        var _rules = this.findRules(filter);
        for (var i = 0, j = _rules.length; i < j; i++) {
            _rules[i].on = _state;
        }
        this.sync();
    };
    RuleEngine.prototype.prioritize = function (priority, filter) {
        var _priority = parseInt(priority, 10);
        var _rules = this.findRules(filter);
        for (var i = 0, j = _rules.length; i < j; i++) {
            _rules[i].priority = _priority;
        }
        this.sync();
    };
    RuleEngine.prototype.toJSON = function () {
        var _rules = this.rules;
        if (_rules instanceof Array) {
            _rules = _rules.map(function (rule) {
                rule.condition = rule.condition.toString();
                rule.consequence = rule.consequence.toString();
                return rule;
            });
        }
        else if (typeof _rules != 'undefined') {
            _rules.condition = _rules.condition.toString();
            _rules.consequence = _rules.consequence.toString();
        }
        return _rules;
    };
    RuleEngine.prototype.fromJSON = function (rules) {
        this.init();
        var FN = Function;
        var _rules = _.clone(rules);
        if (typeof _rules == 'string') {
            _rules = JSON.parse(_rules);
        }
        if (_rules instanceof Array) {
            _rules = _rules.map(function (rule) {
                rule.condition = new FN('return (' + rule.condition + ')')();
                rule.consequence = new FN('return (' + rule.consequence + ')');
                return rule;
            });
        }
        else if (_rules !== null && typeof (_rules) == 'object') {
            _rules.condition = new FN('return (' + _rules.condition + ')')();
            _rules.consequence = new FN('return (' + _rules.consequence + ')')();
        }
        this.register(_rules);
    };
    RuleEngine.prototype.execute = function (fact, cb) {
        var executor = new ChainedExector(this.activeRules, {
            fact: fact
        }, cb);
    };
    return RuleEngine;
}());
RuleEngine.logger = debug('RE:RuleEngine');
exports.RuleEngine = RuleEngine;
var ChainedExector = (function () {
    function ChainedExector() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this._rules = args[0] || [];
        this.matchPath = [];
        this.complete = false;
        var conf = args[1];
        this.session = _.clone(conf.fact);
        this.lastSession = _.clone(conf.fact);
        this.callback = args[2];
        Loop(this, 0);
    }
    Object.defineProperty(ChainedExector.prototype, "length", {
        get: function () {
            return this._rules.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChainedExector.prototype, "rule", {
        get: function () {
            return this._rule;
        },
        set: function (x) {
            this._index = x | 0;
            this._rule = this._rules[x];
        },
        enumerable: true,
        configurable: true
    });
    ChainedExector.prototype.when = function (outcome) {
        var _this = this;
        if (outcome) {
            var rule = this._rule;
            var _consequence_1 = rule ? rule.consequence : false;
            _consequence_1.ruleRef = rule.id || rule.name || 'index_' + this._index;
            process.nextTick(function () {
                _this.matchPath.push(_consequence_1.ruleRef);
                _consequence_1.call(_this.session, _this);
            });
        }
        else {
            process.nextTick(function () {
                _this.next();
            });
        }
    };
    ChainedExector.prototype.restart = function () {
        return Loop(this, 0);
    };
    ChainedExector.prototype.stop = function () {
        this.complete = true;
        return Loop(this, 0);
    };
    ChainedExector.prototype.next = function () {
        var _this = this;
        ChainedExector.logger('go to next rule case');
        process.nextTick(function () {
            return Loop(_this, _this._index + 1);
        });
    };
    return ChainedExector;
}());
ChainedExector.logger = debug('RE:ChainedExector');
var logger = debug('RE:Loop');
function Loop(executor, x, name) {
    if (x < executor.length && executor.complete === false) {
        logger('branch 1');
        executor.rule = x;
        var _rule = executor.rule;
        if (_rule && _.isFunction(_rule.condition)) {
            _rule.condition.call(executor.session, executor);
        }
    }
    else {
        logger('branch 2');
        process.nextTick(function () {
            executor.session.matchPath = executor.matchPath;
            return executor.callback(executor.session);
        });
    }
}
//# sourceMappingURL=index.js.map