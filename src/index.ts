import * as _ from 'lodash';
import * as debug from 'debug';


export class RuleEngine {
  ignoreFactChanges;
  activeRules;
  rules;

  private static logger = debug('RE:RuleEngine')

  constructor(rules?, options?) {
    this.init();
    if (typeof rules !== 'undefined') {
      this.register(rules);
    }
    if (options) {
      this.ignoreFactChanges = options.ignoreFactChanges;
    }
  }

  init() {
    this.rules = [];
    this.activeRules = [];
  }

  register(rules) {
    if (Array.isArray(rules)) {
      this.rules = this.rules.concat(rules);
    } else if (rules !== null && typeof rules === 'object') {
      this.rules.push(rules);
    }
    this.sync();
  }

  sync() {
    //filter rule which is on
    this.activeRules = this.rules.filter(r => {
      if (typeof r.on === 'undefined') {
        r.on = true;//default on
      }
      if (r.on === true) {
        return r;
      }
    });
    //sort by priority
    this.activeRules.sort((a, b) => {
      if (a.priority && b.priority) {
        return b.priority - a.priority;
      } else {
        return 0;
      }
    });
  }

  findRules(filter?) {
    if (typeof filter === 'undefined') {
      return this.rules;
    } else {
      let find = _.matches(filter);
      return _.filter(this.rules, find);
    }
  }

  turn(state, filter) {
    let _state = (['on', 'ON', 'On', 'oN'].indexOf(state) > -1) ? true : false;
    let _rules = this.findRules(filter);
    for (let i = 0, j = _rules.length; i < j; i++) {
      _rules[i].on = _state;
    }
    this.sync();
  }

  prioritize(priority, filter) {
    let _priority = parseInt(priority, 10);
    let _rules = this.findRules(filter);
    for (let i = 0, j = _rules.length; i < j; i++) {
      _rules[i].priority = _priority;
    }
    this.sync();
  }

  toJSON() {
    let _rules = this.rules;
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
  }

  fromJSON(rules) {
    this.init();
    let FN = Function;
    let _rules = _.clone(rules);
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
  }

  execute(fact, cb) {
    // these new attributes have to be in both last session and current session to support
    // the compare function
    let ignoreFactChanges = this.ignoreFactChanges;
    let flow = new Flow(this.activeRules, {
      ignoreFactChanges, fact
    }, cb);
  }
}

class Flow {
  _index;
  _rules;
  _rule;
  matchPath;
  complete;
  session;
  lastSession;
  ignoreFactChanges;
  callback;

  private static logger = debug('RE:Flow')

  constructor(...args) {
    this._rules = args[0] || [];
    this.matchPath = [];
    this.complete = false;

    let conf = args[1];
    this.ignoreFactChanges = conf.ignoreFactChanges;
    this.session = _.clone(conf.fact);
    this.lastSession = _.clone(conf.fact);
    this.callback = args[2];
    Loop(this, 0);
  }

  get length() {
    return this._rules.length;
  }

  get rule() {
    return this._rule;
  }

  set rule(x) {
    this._index = x | 0;
    this._rule = this._rules[x];
  }

  when(outcome) {
    if (outcome) {
      let rule = this._rule;
      let _consequence = rule ? rule.consequence : false;
      _consequence.ruleRef = rule.id || rule.name || 'index_' + this._index;

      process.nextTick(() => {
        this.matchPath.push(_consequence.ruleRef);
        _consequence.call(this.session, this);
      });
    }
    else {
      process.nextTick(() => {
        this.next();
      });
    }
  }

  restart() {
    return Loop(this, 0);
  }

  stop() {
    this.complete = true;
    return Loop(this, 0);
  }

  next() {
    // if (!this.ignoreFactChanges && !_.isEqual(this.lastSession, this.session)) {
    //     Flow.logger('branch 1');
    //     this.lastSession = _.clone(this.session);
    //     process.nextTick(() => {
    //         this.restart();
    //     });
    // } else {
    Flow.logger('branch 2');
    process.nextTick(() => {
      return Loop(this, this._index + 1);
    });
    //}
  }
}

const logger = debug('RE:Loop')
function Loop(flow, x) {
  if (x < flow.length && flow.complete === false) {
    logger('branch 1');
    flow.rule = x;
    var _rule = flow.rule;
    if (_rule && _.isFunction(_rule.condition)) {
      _rule.condition.call(flow.session, flow);
    }
  } else {
    logger('branch 2');
    process.nextTick(() => {
      flow.session.matchPath = flow.matchPath;
      return flow.callback(flow.session);
    });
  }
}
