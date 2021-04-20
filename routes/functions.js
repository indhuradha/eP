


/*npm xml2js to convert xml to json format*/
let xml2js = require('xml2js');

module.exports =
{

	tokenfun: function (token, envvar, content, response, apiname) {
		if (token == undefined || token == '') {
			logmsg = log4js.getLogInJSON(apiname, new Date(), "NA", "NA", "NA", token, envvar, content, { 'message': { 'Error': 'method was not supplied' } });
			//	errorlog.error(JSON.stringify(logmsg));
			return response.status(400).send(JSON.stringify({ 'ErrorCode': 'method was not supplied' }));
		} else if (content == undefined || content == '') {
			logmsg = log4js.getLogInJSON(apiname, new Date(), "NA", "NA", "NA", token, envvar, content, { 'message': { 'Error': 'content argument was not supplied' } });
			//	errorlog.error(JSON.stringify(logmsg));
			return response.status(400).send(JSON.stringify({ 'ErrorCode': 'content argument was not supplied' }));
		}
	},

	affiAuthorxmltojson: function (token, envvar, content, apiname) {
		let jsonres = "";
		xml2js.parseString(content, {
			explicitArray: true, explicitCharkey: true, trim: true, charkey: '#', emptyTag: { "#": '' },
			attrkey: '@', preserveChildrenOrder: true, mergeAttrs: false, ignoreAttrs: false, charsAsChildren: true,
			explicitRoot: true
		}, (err, res) => {
			if (err) {
				console.log(err);
				//logmsg = log4js.getLogInJSON(apiname, new Date(), "NA", "NA", "NA", token, envvar, content, { 'message': { 'Error': err } });
				//	errorlog.error(JSON.stringify(logmsg));
				return JSON.stringify(err);
			}
			//logmsg = log4js.getLogInJSON(apiname, new Date(), "NA", "NA", "NA", token, envvar, content, { 'message': 'success' });
			//	infoLogger.info(JSON.stringify(logmsg));
			jsonres = JSON.stringify(res);
			
		});
		return jsonres;
	},

	usernameExists: function (payload) {
		var username = "";
		if (payload !== undefined) {
			console.log('username exists');
			username = payload;
		} else if (payload == 'unknown' || payload == undefined) {
			console.log('username not exists');
			username = 'unknown';
		}

		return username;
	}


};

