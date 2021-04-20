

/*START#############################################
#
#  Purpose  : Encrypt & decrypt methods of token using NPM crypto-js 
#
#  Author   : Indhumathi R
#
#  Client   : SPS
#
#  Date     : April 13, 2020
#
*/

let CryptoJS = require("crypto-js");

module.exports =
{
	getCyper: function (ciphertext) {
		ciphertext = (ciphertext.replace(/-/g, '+'));
		ciphertext = (ciphertext.replace(/_/g, '/'));
		const keyutf = CryptoJS.enc.Utf8.parse('WcYk\\AKp');
		const iv = CryptoJS.enc.Base64.parse('WcYk\\AKp');
		const dec = CryptoJS.AES.decrypt({ ciphertext: CryptoJS.enc.Base64.parse(ciphertext) }, keyutf, { iv: iv });
		try {
			const decryptedData = JSON.parse(CryptoJS.enc.Utf8.stringify(dec));
			if (JSON.stringify(decryptedData) != '') {
				return decryptedData[0];
			}
			return 0;
		} catch{
			return null;
		}
		
	},
	getEncrypt: function (token) {
		var data = " ";
		if (token.type == 'bks') {
			var data = [{ bks_no: token.bks_no, type: token.type, stage: token.stage, mail_id: token.mail_id }];
			if (token.chap_no !== undefined && token.auth_edit !== undefined) {
				data[0]['chap_no'] = token.chap_no;
				data[0]['auth_edit'] = token.auth_edit;

			} else if (token.chap_no == undefined && token.auth_edit != undefined) {
				data[0]['auth_edit'] = token.auth_edit;
			}else if (token.chap_no !== undefined && token.auth_edit == undefined) {
				data[0]['chap_no'] = token.chap_no;
			} 

		} else {

			data = [{ jnls_no: token.jnls_no, art_no: token.art_no, type: token.type, mail_id: token.mail_id }];
			if (token.auth_edit) {
				data[0]['auth_edit'] = token.auth_edit;
			}

		}

		const keyutf = CryptoJS.enc.Utf8.parse('WcYk\\AKp');
		const iv = CryptoJS.enc.Base64.parse('WcYk\\AKp');

		var ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), keyutf, { iv: iv });
		ciphertext = ciphertext.toString();
		ciphertext = (ciphertext.replace(/\+/g, '-'));
		ciphertext = (ciphertext.replace(/\//g, '_'));
		return ciphertext;
	}
}; 