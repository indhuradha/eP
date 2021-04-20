

/*START#############################################
#
#  Purpose  :Fork method js for gethtml.
#
#  Author   : Indhumathi R
#
#  Client   : Eproofing
#
#  Date     : April 12, 2020
#
######################################################################END*/

/*url_port_details.js file for port & other server endpoint details*/
const e = require('express');
let url_port_details = require('../url_port_details');
const preprocessor = require('../utils/processor');
let fun = require('../functions');
const { response } = require('../app');


/*npm js2xmlparser to convert json to xml format */
let js2xmlparser = require("js2xmlparser");
let fs = require('fs');
var moment = require('moment');

/*npm xml2js to convert xml to json format*/
let xml2js = require('xml2js');

/* npm xmldom to load and traverse through the xml */
let dom = require('xmldom').DOMParser;



var authornamechild = ['prefix', 'givenname', 'particle', 'familyname', 'suffix', 'degrees', 'phone', 'email'];
var oxe = ['oxedel', 'oxeins'];
var authorchild = ['authorname', 'role', 'contact'];
var options = {
    useSelfClosingTagIfEmpty: false,
    format: { doubleQuotes: true, pretty: false },
    declaration: { include: false }
}

async function updateForCorr_Oxe(db, sql, updatecomment) {
    return new Promise(function (resolve, reject) {
        db.run(sql, updatecomment, (err, row) => {
            resolve(row)
        })
    })
}

async function Get_updateForCorr_Oxe(db, sql) {
    return new Promise(function (resolve, reject) {
        db.all(sql, (err, row) => {
            resolve(row)
        })
    })
}
async function preProcessCreateLogFile(s_c, LogFile) {
    return new Promise(function (resolve, reject) {
        signalWriteFilePath = `${LogFile.dataFolderPath}${'log.txt'}`
        if (!fs.existsSync(LogFile.dataFolderPath)) {
            fs.mkdirSync(LogFile.dataFolderPath);
        }

        if (!fs.existsSync(signalWriteFilePath)) {
            fs.writeFile(signalWriteFilePath, s_c, function (err) {
                resolve(LogFile.dataFolderPath);
            })
        }
        else {
            fs.readFile(signalWriteFilePath, { encoding: 'utf-8' }, function (err, htlm_cnt) {
                fs.writeFile(signalWriteFilePath, htlm_cnt + '\n' + s_c, function (err) {
                    resolve(LogFile.dataFolderPath);
                })
            })
        }
    })
}

async function UpdateForCorrectTable(vloop, db, authorsubchild, payLoad, dataFolderPath) {
    return new Promise(function (resolve, reject) {
        let current_time = moment().format('YYYY-MM-DD, hh:mm:ss a');
        var targetid = authorsubchild[vloop]['@']['id'];
        var data = `Author|${authorsubchild[vloop]['#']}`;
        var vFunction = (authorsubchild[vloop]['@']['id'].split('_'))[1];
        var updatecomment = [vFunction, payLoad.authorsequence, data, 0, targetid];
        var insertinputData = [0, targetid, vFunction, payLoad.authorsequence, data];
        let sql = "SELECT * FROM correction WHERE tagid ='" + targetid + "'";
        let sql_u = "SELECT * FROM correction WHERE tagid ='" + targetid + "' AND data ='" + data + "'";
        (async () => {
            let Oxw = await Get_updateForCorr_Oxe(db, sql);
            if (Oxw.length > 0) {
                let Oxw_u = await Get_updateForCorr_Oxe(db, sql_u);
                if (Oxw_u.length == 0) {
                    let sql = `UPDATE correction
                                SET function = ?, authorsequence = ?, data = ?, ignored_correction = ?
                                WHERE tagid = ?`;
                    await updateForCorr_Oxe(db, sql, updatecomment);
                    var s_c = `${payLoad.clientIp} ${current_time}${' Author update - '} ${'Author id: '}${authorsubchild.A_log_id}, ${'id: '}${targetid}, ${'function: '}${vFunction}, ${'authorsequence: '}${payLoad.authorsequence}, ${'data: '}${data}, ${'ignored_correction: '}${0}.`;
                    await preProcessCreateLogFile(s_c, dataFolderPath);
                }
            } else {
                let sql = 'INSERT INTO correction(ignored_correction, tagid, function, authorsequence, data) VALUES(?, ?, ?, ?, ?)';
                await updateForCorr_Oxe(db, sql, insertinputData);
                var s_c = `${payLoad.clientIp} ${current_time}${' Author insert - '} ${'Author id: '}${authorsubchild.A_log_id}, ${'id: '}${targetid}, ${'function: '}${vFunction}, ${'authorsequence: '}${payLoad.authorsequence}, ${'data: '}${data}, ${'ignored_correction: '}${0}.`;
                await preProcessCreateLogFile(s_c, dataFolderPath);

            }

            vloop++;

            if (vloop < authorsubchild.length) {
                UpdateForCorrectTable(vloop, db, authorsubchild, payLoad, dataFolderPath)

            }
            if (vloop == authorsubchild.length) {
                var content = JSON.parse(payLoad.content);
                db.close();

                await JsonToXml(content);

            }
        })();

    })
}

async function processToXml(content, payLoad) {
    return new Promise(function (resolve, reject) {
        var i_u_id = [];
        authorchild.map(function (val) {
            var affiliation_log_id = content.author['@']['id'];
            if (content.author[val] !== undefined) {
                var vauthorchild = content.author[val][0];
                if (val == 'role') {
                    oxe.map(function (val_oxe) {
                        if (vauthorchild[val_oxe] !== undefined) {
                            i_u_id.push(vauthorchild[val_oxe][0]);
                            i_u_id['A_log_id'] = affiliation_log_id;
                        }
                    })

                } else {
                    authornamechild.map(function (value) {
                        if (vauthorchild[value] !== undefined) {
                            var authorsubchild = vauthorchild[value];
                            authorsubchild.map(function (authorsubchild_val) {
                                oxe.map(function (val_oxe) {
                                    if (authorsubchild_val[val_oxe] !== undefined) {
                                        i_u_id.push(authorsubchild_val[val_oxe][0]);
                                        i_u_id['A_log_id'] = affiliation_log_id;
                                    }
                                })
                            })

                        }

                    })
                }
            }

        })
        resolve(i_u_id);
    })
}

async function JsonToXml(content) {
    return new Promise(function (resolve, reject) {
        var xml = js2xmlparser.parse('sample', content, { useSelfClosingTagIfEmpty: false, format: { doubleQuotes: true, pretty: true }, declaration: { include: false } });
        /*NPM js2xmlparser to convert jsontoxml*/
        /*convert the xml to dom structure*/
        var doc = new dom().parseFromString(xml);

        // 			/*to get the child nodes from the xml and exclude the sample tag */
        var nodes = doc.documentElement.childNodes;
        process.send({ counter: { status: 200, msg: nodes.toString() } });
        process.exit();
    })
}

async function Forkaq(payLoad) {
    try {

        if (payLoad.method == 'xmltojson') {
            /*Input XML content*/
            var data = payLoad.content.replace(/nogivenname/g, 'givenname');
            /*Function to convert input XML to JSON*/
            let resfromfun = fun.affiAuthorxmltojson(payLoad.method, url_port_details.node_env, data, response);

            process.send({ counter: { status: 200, msg: resfromfun } });
            process.exit();
        } else {
            const Generate_Token = { dbtype: payLoad.dbtype, 'tk': { token: payLoad.token } };
            const db = preprocessor.preProcessSentToToken(Generate_Token);
            const dataFolderPath = await preprocessor.preProcessGetDataFolder(payLoad);
            var content = JSON.parse(payLoad.content);
            (async () => {
                let authorsubchild = await processToXml(content, payLoad);
                if (authorsubchild.length == 0) {
                    db.close();
                    await JsonToXml(content);

                } else {
                    await UpdateForCorrectTable(0, db, authorsubchild, payLoad, dataFolderPath);

                }
            })();

        }
    }
    catch (error) {
        process.send({ counter: { status: 400, msg: error.toString() } });
        process.exit();
    }
}

// receive message from master process
process.on('message', async (message) => {
    await Forkaq(message);
});