

/*START#############################################
#
#  Purpose  :Fork method js for gethtml.
#
#  Author   : Indhumathi R
#
#  Client   : eproofing
#
#  Date     : April 12, 2020
#
######################################################################END*/

/*url_port_details.js file for port & other server endpoint details*/
let url_port_details = require('../url_port_details');
const preprocessor = require('../utils/processor');
/* npm fs for file reading and file writing operations in service */
let fs = require('fs');
let glob = require('glob');
var _ = require('lodash');

async function GetDataForBeforelandingpage(sql_g, db) {
    return new Promise(function (resolve, reject) {
        db.all(sql_g, (err, val) => {
            resolve(val);
        })
    })
}
async function ForkChapterPage(input) {
    try {
        if (input.method == 'get') {
            var vauth_edit = false;
            if (input.auth_edit) {
                vauth_edit = true;
                var sql_mail_info = `${"select articledoi,journalname,articletitle from article group by articledoi"}`;
            } else {

                var sql_mail_info = `${"select articledoi,journalname,articletitle,authormailid,authorsequence from article"} ${'where authormailid='}'${input.mail_id}'`;
            }
            const Generate_Token = { dbtype: input.dbtype, 'tk': { token: input.token } };
            var db = preprocessor.preProcessSentToToken(Generate_Token);
            let opt = await GetDataForBeforelandingpage(sql_mail_info, db);
            db.close();
            opt[0]['auth_edit'] = vauth_edit;
            opt[0]['jnls_no'] = input.jnls_no;
            process.send({ counter: { status: 200, msg: opt } });
            process.exit();

        } else {
            const data_Path = await preprocessor.preProcessGetDataFolder(input);
            var chap_list_path = `${data_Path.dataFolderPath}`;
            glob(chap_list_path + "/*(*_DeltaPDF.*|*_Author.*|*_EpsilonPDF.*|*_ESM.*)", {}, (err, files) => {
                try {
                    var pdfArray = [];
                    var supportingArray = [];
                    files.map(function (val, key) {
                        if (val.includes("_Author.pdf")) {
                            pdfArray.push({ 'pdfpath': val })
                        } else {
                            supportingArray.push(val);
                            pdfArray[0]['supportingFiles'] = supportingArray

                        }

                    })
                    process.send({ counter: { 'status': 200, msg: pdfArray } });
                    process.exit();

                }
                catch (e) {
                    process.send({ counter: { status: 400, msg: e.toString() } });
                    process.exit();
                }
            })
        }
    }
    catch (error) {
        process.send({ counter: { status: 400, msg: error.toString() } });
        process.exit();
    }
}

// receive message from master process
process.on('message', async (message) => {
    await ForkChapterPage(message);
});