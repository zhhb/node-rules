var RuleEngine = require('../dist').RuleEngine;
/* Set of Rules to be applied */
var rules = [{
  "priority": 4,
  "condition": function (R) {
    R.when(this.transactionTotal < 500);
  },
  "consequence": function (R) {
    this.result = false;
    this.reason = "The transaction was blocked as it was less than 500";
    R.stop();
  }
}, {
  "priority": 10, // this will apply first
  "condition": function (R) {
    R.when(this.application === 'JD' && this.cardType === "alipay");
  },
  "consequence": function (R) {
    this.result = false;
    this.reason = "The transaction was blocked as alipay are not allowed";
    R.stop();
  }
}];
/* Creating Rule Engine instance and registering rule */
var R = new RuleEngine();
R.register(rules);
/* Fact with more than 500 as transaction but alipay, and this should be blocked */
var fact = {
  "name": "user4",
  "application": "JD",
  "transactionTotal": 600,
  "payType": "alipay"
};
/* This fact will be blocked by the Debit card rule as its of more priority */
R.execute(fact, function (data) {
  if (data.result) {
    console.log("Valid transaction");
  } else {
    console.log("Blocked Reason:" + data.reason);
  }
});
