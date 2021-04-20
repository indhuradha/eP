

/*START#############################################
#
#  Purpose  : to get the mathametical images and equations from the images folder
#
#  Author   : Indhumathi
#
#  Client   : SPS
#
#  Project  : Eprooing
#
#  Date     : May 07, 2020
##################################################*/


/*To get the value of other server url details*/
let url_port_details = require('../url_port_details');
let xml2js = require('xml2js');
/*npm to convert the xml2js ,which converts the math,xml file content to json*/
var parseString = xml2js.parseString;
/* read the math.xml file from the project folder using npm fs*/
var fs = require('fs');

var camelCaseKeys = {
	"math": "MATHS",
	"gkfun": "GKFN",
	"arrows": "ARROW",
	"logic": "LOGIC",
	"symbols": "SYMBOL",
	"format": "FORMAT"
}
const options = {
	explicitArray: false, explicitCharkey: false, trim: true,
	attrkey: '@', preserveChildrenOrder: true, explicitRoot: true
}

async function ForkGetMath(data) {
	try {
		var xml_inp = fs.readFileSync(__dirname + '/math.xml');
		var myMaths = [];
		var jsonMath = [];


		parseString(xml_inp, options, (err, res) => {
			if (err) {
				process.send({ counter: { status: 400, msg: err.toString() } });
				process.exit();
			} else {
				var mathkeys = Object.keys(res.xml);
				for (var m = 0; m < mathkeys.length; m++) {
					var vcamelCaseKeys = ''
					for (var i = 0; i < res.xml[mathkeys[m]].image.length; i++) {
						vcamelCaseKeys = camelCaseKeys[mathkeys[m]];
						if (mathkeys[m] == 'format') {
							var testCondition = res.xml.format.image[i].src;
							if (testCondition == 'TrueType' || testCondition == 'Bold' || testCondition == 'Italic' || testCondition == 'tiny' || testCondition == 'script' || testCondition == 'small' || testCondition == 'normal' || testCondition == 'large' || testCondition == 'huge') {
								var src = '\\' + res.xml.format.image[i].command + " ";
								var file = res.xml.format.image[i].src;
							}
							else {
								var src = '\\color{' + res.xml.format.image[i].command + '} ';
								var file = res.xml.format.image[i].command;
							}
							jsonMath.push({ 'file': file, 'src': src });

						} else {
							jsonMath.push({ 'file': res.xml[mathkeys[m]].image[i].command, 'src': url_port_details.imageServerPath + res.xml[mathkeys[m]].image[i].src + ".png" });
						}


					}
					myMaths.push({ [vcamelCaseKeys]: jsonMath });
					jsonMath = [];
				}
			}
		})
		process.send({ counter: { status: 200, msg: myMaths } });
		process.exit();
	}
	catch (error) {
		console.log(error.toString() )
		process.send({ counter: { status: 400, msg: error.toString() } });
		process.exit();
	}
}

// receive message from master process
process.on('message', async (message) => {
	await ForkGetMath(message);

});