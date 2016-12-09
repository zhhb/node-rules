var RuleEngine = require('../dist').RuleEngine;
/**
 * 1、支付金额大于100
 * 2、异地登录情况
 **/
var rules = [{
    "condition": function(R) {
        R.when(this.transactionTotal > 100);
    },
    "consequence": function(R) {
        this.score += 100;
        this.reason = ["交易金额大于100"];
        R.next();
    }
}, {
    "condition": function(R) {
        R.when(this.diff_login);
    },
    "consequence": function(R) {
        this.score += 200;
        this.reason.push("异地登录");
        R.stop();
    }
}];
/* Creating Rule Engine instance and registering rule */
var R = new RuleEngine(rules,{ignoreFactChanges:true});

var fact = {
    "name": "user4",
    "application": "MOB2",
    "transactionTotal": 600,
    "cardType": "Debit",
    "diff_login":true,
    "score":0,
    "score_danger":200
};
R.execute(fact, function(data) {
    if (data.score>data.score_danger) {
        console.log("非法交易: "+ data.reason.join(','));
    } else {
        console.log("交易正常");
    }
});
