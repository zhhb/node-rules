"use strict";
var _ = require("lodash");
var RuleEngine = (function () {
    function RuleEngine(rules, options) {
        this.init();
        if (typeof rules !== 'undefined') {
            this.register(rules);
        }
        if (options) {
            this.ignoreFactChanges = options.ignoreFactChanges;
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
        var ignoreFactChanges = this.ignoreFactChanges;
        var flow = new Flow(this.activeRules, {
            ignoreFactChanges: ignoreFactChanges, fact: fact
        }, cb);
    };
    return RuleEngine;
}());
exports.RuleEngine = RuleEngine;
var Flow = (function () {
    function Flow() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this._rules = args[0] || [];
        this.matchPath = [];
        this.complete = false;
        var conf = args[1];
        this.ignoreFactChanges = conf.ignoreFactChanges;
        this.session = _.clone(conf.fact);
        this.lastSession = _.clone(conf.fact);
        this.callback = args[2];
        Loop(this, 0);
    }
    Object.defineProperty(Flow.prototype, "length", {
        get: function () {
            return this._rules.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Flow.prototype, "rule", {
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
    Flow.prototype.when = function (outcome) {
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
    Flow.prototype.restart = function () {
        return Loop(this, 0);
    };
    Flow.prototype.stop = function () {
        this.complete = true;
        return Loop(this, 0);
    };
    Flow.prototype.next = function () {
        var _this = this;
        if (!this.ignoreFactChanges && !_.isEqual(this.lastSession, this.session)) {
            this.lastSession = _.clone(this.session);
            process.nextTick(function () {
                _this.restart();
            });
        }
        else {
            process.nextTick(function () {
                return Loop(_this, _this._index + 1);
            });
        }
    };
    return Flow;
}());
function Loop(flow, x) {
    if (x < flow.length && flow.complete === false) {
        flow.rule = x;
        var _rule = flow.rule;
        if (_rule && _.isFunction(_rule.condition)) {
            _rule.condition.call(flow.session, flow);
        }
    }
    else {
        process.nextTick(function () {
            flow.session.matchPath = flow.matchPath;
            return flow.callback(flow.session);
        });
    }
}
//# sourceMappingURL=index.js.map