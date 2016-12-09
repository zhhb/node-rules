"use strict";
var index_1 = require("./index");
var chai_1 = require("chai");
describe('Rules', function () {
    describe('.init()', function () {
        it('should empty the existing rule array', function () {
            var rules = [{
                    'condition': function (R) {
                        R.when(1);
                    },
                    'consequence': function (R) {
                        R.stop();
                    }
                }];
            var RX = new index_1.RuleEngine(rules);
            RX.init();
            chai_1.expect(RX.rules).to.eql([]);
        });
    });
    describe('.register()', function () {
        it('Rule should be turned on if the field - ON is absent in the rule', function () {
            var rules = [{
                    'condition': function (R) {
                        R.when(1);
                    },
                    'consequence': function (R) {
                        R.stop();
                    }
                }];
            var RX = new index_1.RuleEngine(rules);
            chai_1.expect(RX.rules[0].on).to.eql(true);
        });
        it('Rule can be passed to register as both arrays and individual objects', function () {
            var rule = {
                'condition': function (R) {
                    R.when(1);
                },
                'consequence': function (R) {
                    R.stop();
                }
            };
            var RX1 = new index_1.RuleEngine(rule);
            var RX2 = new index_1.RuleEngine([rule]);
            chai_1.expect(RX1.rules).to.eql(RX2.rules);
        });
        it('Rules can be appended multiple times via register after creating rule engine instance', function () {
            var rules = [
                {
                    'condition': function (R) {
                        R.when(1);
                    },
                    'consequence': function (R) {
                        R.stop();
                    }
                },
                {
                    'condition': function (R) {
                        R.when(0);
                    },
                    'consequence': function (R) {
                        R.stop();
                    }
                }
            ];
            var RX1 = new index_1.RuleEngine(rules);
            var RX2 = new index_1.RuleEngine(rules[0]);
            RX2.register(rules[1]);
            chai_1.expect(RX1.rules).to.eql(RX2.rules);
        });
    });
    describe('.sync()', function () {
        it('should only push active rules into active rules array', function () {
            var rules = [
                {
                    'condition': function (R) {
                        R.when(1);
                    },
                    'consequence': function (R) {
                        R.stop();
                    },
                    'id': 'one',
                    'on': true
                },
                {
                    'condition': function (R) {
                        R.when(0);
                    },
                    'consequence': function (R) {
                        R.stop();
                    },
                    'id': 'one',
                    'on': false
                }
            ];
            var RX = new index_1.RuleEngine();
            RX.register(rules);
            chai_1.expect(RX.activeRules).not.to.eql(RX.rules);
        });
        it('should sort the rules accroding to priority, if priority is present', function () {
            var rules = [
                {
                    'priority': 8,
                    'index': 1,
                    'condition': function (R) {
                        R.when(1);
                    },
                    'consequence': function (R) {
                        R.stop();
                    },
                },
                {
                    'priority': 6,
                    'index': 2,
                    'condition': function (R) {
                        R.when(1);
                    },
                    'consequence': function (R) {
                        R.stop();
                    },
                },
                {
                    'priority': 9,
                    'index': 0,
                    'condition': function (R) {
                        R.when(1);
                    },
                    'consequence': function (R) {
                        R.stop();
                    },
                }
            ];
            var RX = new index_1.RuleEngine();
            RX.register(rules);
            chai_1.expect(RX.activeRules[2].index).to.eql(2);
        });
    });
    describe('.exec()', function () {
        it('should run consequnce when condition matches', function (done) {
            var rule = {
                'condition': function (R) {
                    R.when(this && (this.transactionTotal < 500));
                },
                'consequence': function (R) {
                    this.result = false;
                    R.stop();
                }
            };
            var R = new index_1.RuleEngine(rule);
            R.execute({
                'transactionTotal': 200
            }, function (session) {
                chai_1.expect(session.result).to.eql(false);
                done();
            });
        });
        it('should chain rules and find result with next()', function (done) {
            var rule = [
                {
                    'condition': function (R) {
                        R.when(this && (this.card == 'VISA'));
                    },
                    'consequence': function (R) {
                        R.stop();
                        this.result = 'Custom Result';
                    },
                    'priority': 4
                },
                {
                    'condition': function (R) {
                        R.when(this && (this.transactionTotal < 1000));
                    },
                    'consequence': function (R) {
                        R.next();
                    },
                    'priority': 8
                }
            ];
            var RX = new index_1.RuleEngine(rule);
            RX.execute({
                'transactionTotal': 200,
                'card': 'VISA'
            }, function (session) {
                chai_1.expect(session.result).to.eql('Custom Result');
                done();
            });
        });
        it('should provide access to rule definition properties via rule()', function (done) {
            var rule = {
                'name': 'sample rule name',
                'id': 'xyzzy',
                'condition': function (R) {
                    R.when(this && (this.input === true));
                },
                'consequence': function (R) {
                    this.ruleName = R.rule.name;
                    this.ruleID = R.rule.id;
                    R.stop();
                    this.result = true;
                }
            };
            var RX = new index_1.RuleEngine(rule);
            RX.execute({
                'input': true
            }, function (session) {
                chai_1.expect(session.ruleName).to.eql(rule.name);
                chai_1.expect(session.ruleID).to.eql(rule.id);
                done();
            });
        });
        it('should include the matched rule path', function (done) {
            var rules = [
                {
                    'name': 'rule A',
                    'condition': function (R) {
                        R.when(this && (this.x === true));
                    },
                    'consequence': function (R) {
                        R.next();
                    }
                },
                {
                    'name': 'rule B',
                    'condition': function (R) {
                        R.when(this && (this.y === true));
                    },
                    'consequence': function (R) {
                        R.next();
                    }
                },
                {
                    'id': 'rule C',
                    'condition': function (R) {
                        R.when(this && (this.x === true && this.y === false));
                    },
                    'consequence': function (R) {
                        R.next();
                    }
                },
                {
                    'id': 'rule D',
                    'condition': function (R) {
                        R.when(this && (this.x === false && this.y === false));
                    },
                    'consequence': function (R) {
                        R.next();
                    }
                },
                {
                    'condition': function (R) {
                        R.when(this && (this.x === true && this.y === false));
                    },
                    'consequence': function (R) {
                        R.next();
                    }
                }
            ];
            var lastMatch = 'index_' + ((rules.length) - 1).toString();
            var R = new index_1.RuleEngine(rules);
            R.execute({
                'x': true,
                'y': false
            }, function (session) {
                chai_1.expect(session.matchPath).to.eql([rules[0]['name'], rules[2]['id'], lastMatch]);
                done();
            });
        });
    });
    describe('.findRules()', function () {
        var rules = [
            {
                'condition': function (R) {
                    R.when(1);
                },
                'consequence': function (R) {
                    R.stop();
                },
                'id': 'one'
            },
            {
                'condition': function (R) {
                    R.when(0);
                },
                'consequence': function (R) {
                    R.stop();
                },
                'id': 'two'
            }
        ];
        var RX = new index_1.RuleEngine(rules);
        it('find selector function for rules should exact number of matches', function () {
            chai_1.expect(RX.findRules({ 'id': 'one' }).length).to.eql(1);
        });
        it('find selector function for rules should give the correct match as result', function () {
            chai_1.expect(RX.findRules({ 'id': 'one' })[0].id).to.eql('one');
        });
        it('find without condition works fine', function () {
            chai_1.expect(RX.findRules().length).to.eql(2);
        });
    });
    describe('.turn()', function () {
        var rules = [
            {
                'condition': function (R) {
                    R.when(1);
                },
                'consequence': function (R) {
                    R.stop();
                },
                'id': 'one'
            },
            {
                'condition': function (R) {
                    R.when(0);
                },
                'consequence': function (R) {
                    R.stop();
                },
                'id': 'two',
                'on': false
            }
        ];
        var RX = new index_1.RuleEngine(rules);
        it('checking whether turn off rules work as expected', function () {
            RX.turn('OFF', { 'id': 'one' });
            chai_1.expect(RX.findRules({ 'id': 'one' })[0].on).to.eql(false);
        });
        it('checking whether turn on rules work as expected', function () {
            RX.turn('ON', { 'id': 'two' });
            chai_1.expect(RX.findRules({ 'id': 'two' })[0].on).to.eql(true);
        });
    });
    describe('.prioritize()', function () {
        var rules = [
            {
                'condition': function (R) {
                    R.when(1);
                },
                'consequence': function (R) {
                    R.stop();
                },
                'id': 'two',
                'priority': 1
            },
            {
                'condition': function (R) {
                    R.when(0);
                },
                'consequence': function (R) {
                    R.stop();
                },
                'id': 'zero',
                'priority': 8
            },
            {
                'condition': function (R) {
                    R.when(0);
                },
                'consequence': function (R) {
                    R.stop();
                },
                'id': 'one',
                'priority': 4
            }
        ];
        var RX = new index_1.RuleEngine(rules);
        it('checking whether prioritize work', function () {
            RX.prioritize(10, { 'id': 'one' });
            chai_1.expect(RX.findRules({ 'id': 'one' })[0].priority).to.eql(10);
        });
        it('checking whether rules reorder after prioritize', function () {
            RX.prioritize(12, { 'id': 'two' });
            chai_1.expect(RX.activeRules[0].id).to.eql('two');
        });
    });
    describe('.toJSON() & .fromJSON', function () {
        var rules = [{
                'condition': function (R) {
                    R.when(1);
                },
                'consequence': function (R) {
                    R.stop();
                },
                'on': true
            }];
        it('rules after toJSON and fromJSON back should be equivalent to the old form', function () {
            var RX1 = new index_1.RuleEngine(rules);
            var store = RX1.toJSON();
            var RX2 = new index_1.RuleEngine();
            RX2.fromJSON(store);
            chai_1.expect(RX1.rules).to.eql(RX2.rules);
        });
        it('rules serilisation & back working fine?', function () {
            var RX = new index_1.RuleEngine(rules);
            var store = RX.toJSON();
            RX.fromJSON(store);
            chai_1.expect(rules).to.eql(RX.rules);
        });
    });
    describe('ignoreFactChanges', function () {
        var rules = [{
                'name': 'rule1',
                'condition': function (R) {
                    R.when(this.value1 > 5);
                },
                'consequence': function (R) {
                    this.result = false;
                    this.errors = this.errors || [];
                    this.errors.push('must be less than 5');
                    R.next();
                }
            }];
        var fact = {
            'value1': 6
        };
        it('doesn\'t return when a fact changes if ignoreFactChanges is true', function (done) {
            var RX = new index_1.RuleEngine(rules, { ignoreFactChanges: true });
            RX.execute(fact, function (session) {
                chai_1.expect(session.errors).to.have.length(1);
                done();
            });
        });
    });
});
//# sourceMappingURL=index.spec.js.map