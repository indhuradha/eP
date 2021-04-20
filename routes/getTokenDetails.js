
/*token.js to get the decrypted data from the token */
let jwtToken = require('./token.js');

exports.GetTokenDetails = (req, res) => {

    var token = req.query.token;
    try {
        if (token == undefined || token == '') {
            res.send(JSON.stringify({ 'Error': 'Unable to find the token value. please check' }));
        } else {
            /*To get the payload from the token*/
            var payLoad = jwtToken.getCyper(token);
            if (payLoad != 0) {
                res.status(200).send(payLoad);
            }else{
                res.status(400).send({ 'Error': 'invalid token'});

            }
        }
     
    }
    catch (err) {
        res.status(400).send({ 'Error': JSON.stringify(err.Error)});
    }

}
