/*START#############################################
#
#  Purpose  :Fork method js for correction.
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
let fs = require('fs');
var moment = require('moment');

async function preProcessCreateLogFile(s_c, LogFile) {
    return new Promise(function (resolve, reject) {
        signalWriteFilePath = `${LogFile.dataFolderPath}${'log.txt'}`
        if (!fs.existsSync(LogFile.dataFolderPath)) {
            fs.mkdirSync(LogFile.dataFolderPath);
        }

        if (!fs.existsSync(signalWriteFilePath)) {
            fs.writeFile(signalWriteFilePath, s_c, function (err) {
                resolve(LogFile.file_Path);
            })
        }
        else {
            fs.readFile(signalWriteFilePath, { encoding: 'utf-8' }, function (err, htlm_cnt) {
                fs.writeFile(signalWriteFilePath, htlm_cnt + '\n' + s_c, function (err) {
                    resolve(LogFile.file_Path);
                })
            })
        }
    })
}


async function get_Correction(db) {
    return new Promise(function (resolve, reject) {
        db.all("SELECT * FROM correction where (ignored_correction='2' or ignored_correction='0') and tagid not in (select tagid from correction where function = 'Undo' and ignored_correction='2') order by id DESC", (err, row) => {


            if (err) {
                process.send({ counter: { status: 400, msg: err.toString() } });
                db.close();
                process.exit();
            }
            else {
                process.send({ counter: { status: 200, msg: row } });
                db.close();
                process.exit();
            }
        });
    });

}


async function CallBackInsertForCorrection(insertinputData, sql, db) {
    return new Promise(function (resolve, reject) {
        db.all(sql, insertinputData, (err, row) => {
            resolve(row);
        })
    })

}
async function CallBackUpdateForCorrection(sql, db) {
    return new Promise(function (resolve, reject) {
        db.all(sql, (err, row) => {
            resolve(row);
        })
    })

}

async function UpdateForCorrection(payLoad, db) {
    return new Promise(function (resolve, reject) {
        (async () => {
            let current_time = moment().format('YYYY-MM-DD, hh:mm:ss a');
            if (payLoad.correctiondata) {
                for (const [key, value] of Object.entries(payLoad.correctiondata)) {
                    var ignored_correction = value.ignored_correction;
                    var vfunction = value.function;
                    var tagid = value.tagid;
                    var authorsequence = value.authorsequence;
                    var data = value.data;
                    var oldtagid = value.oldtagid;
                    const dataFolderPath = await preprocessor.preProcessGetDataFolder(payLoad);
                    var s_c = `${payLoad.clientIp} ${current_time}${' Correction - '} ${'id: '}${tagid}, ${'function: '}${vfunction}, ${'data: '}${data}.`;
                    if (ignored_correction == 0 || ignored_correction == 2) {
                        if (vfunction == 'Update Comment') {
                            let updatecomment = [vfunction, authorsequence, tagid, data, ignored_correction, oldtagid];
                            let sql = `UPDATE correction
                        SET function = ?, authorsequence = ?, tagid = ?, data = ?, ignored_correction = ?
                        WHERE tagid = ?`;
                            await CallBackInsertForCorrection(updatecomment, sql, db);
                            var s_c = `${payLoad.clientIp} ${current_time}${' Correction - '} ${'newid: '}${tagid}, ${'oldid: '}${oldtagid}, ${'function: '}${vfunction}, ${'data: '}${data}.`;
                            await preProcessCreateLogFile(s_c, dataFolderPath);
                        } else if (vfunction == 'undo') {
                            let updatecomment = [ignored_correction, tagid, vfunction, authorsequence, data];
                            let sql = 'INSERT INTO correction(ignored_correction, tagid, function, authorsequence, data) VALUES(?, ?, ?, ?, ?)';
                            await CallBackInsertForCorrection(updatecomment, sql, db);
                            await preProcessCreateLogFile(s_c, dataFolderPath);
                        }
                        else if (vfunction === 'del' || vfunction === 'insert' || 'comment' == vfunction || 'Math' == vfunction || vfunction == 'roman') {
                            if (oldtagid != undefined) {
                                var sqles = "SELECT * FROM correction where tagid='" + oldtagid + "'";
                                var new_tag_id = oldtagid;
                            } else {
                                var sqles = "SELECT * FROM correction where tagid='" + tagid + "'";
                                var new_tag_id = tagid;
                            }
                            let tagopt = await CallBackUpdateForCorrection(sqles, db);
                            if (tagopt == undefined || tagopt.length == 0) {
                                var insertinputData = [ignored_correction, tagid, vfunction, authorsequence, data];
                                let sqls = 'INSERT INTO correction(ignored_correction, tagid, function, authorsequence, data) VALUES(?, ?, ?, ?, ?)';
                                await CallBackInsertForCorrection(insertinputData, sqls, db);
                                await preProcessCreateLogFile(s_c, dataFolderPath);
                            } else {
                                if (vfunction === 'del') {
                                    var sql = `UPDATE correction SET data = ? WHERE tagid = ?`;
                                    var updatecomment = [data, tagid];
                                    await CallBackInsertForCorrection(updatecomment, sql, db);
                                    await preProcessCreateLogFile(s_c, dataFolderPath);
                                } else {
                                    var updatecomment = [vfunction, authorsequence, tagid, data, ignored_correction, new_tag_id];
                                    var sql = `UPDATE correction
                           SET function = ?, authorsequence = ?, tagid = ?, data = ?, ignored_correction = ?
                           WHERE tagid = ?`;
                                    await CallBackInsertForCorrection(updatecomment, sql, db);
                                    await preProcessCreateLogFile(s_c, dataFolderPath);
                                }
                            }
                        }
                    }

                }
            }

            await get_Correction(db);
        })();
    })

}


async function ForkCorrection(payLoad) {
    try {
        const Generate_Token = { dbtype: payLoad.dbtype, 'tk': { token: payLoad.token } };
        const db_On = preprocessor.preProcessSentToToken(Generate_Token);
        /* Find ignored_correction 2|0  && function equal to undo & ignored_correction equal to 2*/
        if (payLoad.method == 'get') {
            await get_Correction(db_On);
        } else {
            await UpdateForCorrection(payLoad, db_On);
        }
    }
    catch (error) {
        process.send({ counter: { status: 400, msg: error.toString() } });
        process.exit();
    }
}

// receive message from master process
process.on('message', async (message) => {
    await ForkCorrection(message);
});