var RuleEngine = require('../dist').RuleEngine;
/* Here we can see a rule which upon matching its condition,
does some processing and passes it to other rules for processing */
var rules = [{
  "condition": function (R) {
    R.when(this.application === "alipay" && this.appPlatform === 'ios');
  },
  "consequence": function (R) {
    this.isMobile = true;
    R.next();//we just set a value on to fact, now lests process rest of rules
  }
}, {
  "condition": function (R) {
    R.when(this.transactionTotal > 20000 && this.transactionType === 'transfer_YEB_to_Bank');
  },
  "consequence": function (R) {
    this.result = false;
    this.reason = "交易终止，余额宝产出即时到账每日上线为20000";
    R.stop();
  }
}];
/* Creating Rule Engine instance and registering rule */
var R = new RuleEngine();
R.register(rules);
/* Fact with more than 500 as transaction but a Debit card, and this should be blocked */
var fact = {
  "name": "user4",
  "application": "alipay",
  "transactionTotal": 60000,
  "transactionType": "transfer_YEB_to_Bank",
  "appPlatform": "ios"
};
R.execute(fact, function (data) {

  if (data.result) {
    console.log("Valid transaction");
  } else {
    console.log("Blocked Reason:" + data.reason);
  }

  if (data.isMobile) {
    console.log("It was from a mobile device too!!");
  }

});
