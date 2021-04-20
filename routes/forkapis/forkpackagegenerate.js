
/*START#############################################
#
#  Purpose  :Fork method js for imganno.
#
#  Author   : Indhumathi R
#
#  Client   : eproofing
#
#  Date     : April 12, 2020
#
######################################################################END*/

const preprocessor = require('../utils/processor');
/*url_port_details.js file for port & other server endpoint details*/
var url_port_details = require('../url_port_details');
let fs = require('fs');
var moment = require('moment');
var current_time = moment().format('YYYY-MM-DD_hh:mm:ss');
const _ = require('lodash');

function CommomQuery(sqlquery, db) {
    return new Promise(function (resolve, reject) {
        db.all(sqlquery, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);

            }
        })
    })

}
async function preProcessCreateLogFile(s_c, LogFile, log_write_path) {
    return new Promise(function (resolve, reject) {
        if (!fs.existsSync(LogFile.dataFolderPath)) {
            fs.mkdirSync(LogFile.dataFolderPath);
        }

        if (!fs.existsSync(log_write_path)) {
            fs.writeFile(log_write_path, s_c, function (err) {
                resolve(LogFile.dataFolderPath);
            })
        }
        else {
            fs.readFile(log_write_path, { encoding: 'utf-8' }, function (err, htlm_cnt) {
                fs.writeFile(log_write_path, htlm_cnt + '\n' + s_c, function (err) {
                    resolve(LogFile.dataFolderPath);
                })
            })
        }
    })
}


async function CopAndWrite_File(data_Path, payLoad) {
    return new Promise(function (resolve, reject) {
        (async () => {
            const fs = require('fs-extra');
            if (payLoad.type == 'jnls') {

                var writehtmledir = `${url_port_details.filePath}${url_port_details[payLoad.type]}${'to_production/'}${data_Path.data_File_Path}`;


                var copy_location = `${data_Path.dataFilePath}`;
                fs.copy(copy_location, writehtmledir);
                var log_write_path = `${data_Path.dataFolderPath}${'log.txt'}`
            } else {
                if (payLoad.stage == 300) {
                    var log_write_path = `${data_Path.dataFolderPath}${'log.txt'}`

                    var writehtmledir = `${url_port_details.filePath}${url_port_details[payLoad.type]}${'to_production/'}${payLoad.bks_no}_${payLoad.chap_no}_${'submitted.txt'}`;
                } else {


                    var log_write_path = `${data_Path.dataFolder_book}${'log.txt'}`;

                    var writehtmledir = `${url_port_details.filePath}${url_port_details[payLoad.type]}${'to_production/'}${payLoad.bks_no}_${'submitted.txt'}`;
                }
                fs.writeFile(writehtmledir, '')

            }
            resolve(log_write_path);
        })();
    })
}

async function ForkPostPackageGenerate(payLoad) {
    try {
        (async () => {
            let ip = payLoad.data.clientIp;
            var clientIp = '';
            if (ip) {
                clientIp = ip.match(/\d+/g).join().replace(/,/g, '.');
            }
            payLoad.data['clientIp'] = clientIp;
            var sqlite3 = require('sqlite3').verbose();
            var data_Path = await preprocessor.preProcessGetDataFolder(payLoad.data);
            if (payLoad.data.type == 'jnls') {
                var db_Name = 'article';
                var db_Status = 'submitstatus';
                var sql_db = `${url_port_details.filePath}${url_port_details[payLoad.data.type]}/${payLoad.data.jnls_no}/${payLoad.data.art_no}/Query_ImageAnno.data`;

            } else {

                var sql_db = `${url_port_details.filePath}${url_port_details[payLoad.data.type]}${payLoad.data.stage}/${payLoad.data.bks_no}/Query_ImageAnno.data`;
                if (payLoad.data.stage == '650') {
                    var db_Name = 'book';
                    var db_Status = 'submitstatus';
                } else {
                    var db_Name = 'chapter';
                    var db_Status = 'chapterstatus';

                }
            }
            var sql_query = `${'SELECT'} ${db_Status} FROM ${db_Name} WHERE authorsequence = (SELECT max(authorsequence) FROM ${db_Name})`

            var db = new sqlite3.Database(sql_db);
            let opt_J_C = await CommomQuery(sql_query, db);
            db.close();
            if (!_.isEmpty(opt_J_C)) {
                if (opt_J_C[0][db_Status] == 0) {
                    let vlog_write_path = await CopAndWrite_File(data_Path, payLoad.data);
                    var s_c = `${payLoad.data.clientIp} ${current_time}, ${'Package Generated Successfully'}.`;
                    await preProcessCreateLogFile(s_c, data_Path, vlog_write_path);
                    process.send({ counter: { status: 200, msg: `${'Package Generated Successfully'}` } });
                    process.exit();

                } else {
                    process.send({ counter: { status: 400, msg: `${'Status is not submitted'}` } });
                    process.exit();

                }

            } else {
                process.send({ counter: { status: 400, msg: `${'No Records in Db'}` } });
                process.exit();

            }
        })();
    }
    catch (error) {
        process.send({ counter: { status: 400, msg: error.toString() } });
        process.exit();
    }
}

// receive message from master process
process.on('message', async (message) => {
    await ForkPostPackageGenerate(message);
});