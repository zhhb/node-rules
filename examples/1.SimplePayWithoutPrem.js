var  RuleEngine = require('../dist').RuleEngine;
/*简单的小额免密支付规则*/
var rule = {
    "name":"小额免密支付规则",
    "condition": function(R) {
        R.when(this.transactionTotal > 200);//小额免密支付限制
    },
    "consequence": function(R) {
        this.result = false;
        this.reason = "免密支付交易失败，需要输入密码";
        R.stop();
    }
};

/* Creating Rule Engine instance and registering rule */
var R = new RuleEngine();
R.register(rule);
/* Fact with less than 500 as transaction, and this should be blocked */
var fact = {
    "name": "用户1",
    "application": "支付宝",
    "transactionTotal": 400,
    "cardType": "Credit Card"
};
R.execute(fact, function(data) {
    if (data.result) {
        console.log("满足安全需要，可以免密支付");
    } else {
        console.log("交易挂起:" + data.reason);
    }
});
