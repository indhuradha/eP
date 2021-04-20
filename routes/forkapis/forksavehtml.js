
/*START#############################################
#
#  Purpose  :Fork method js for savehtml.
#
#  Author   : Indhumathi R
#
#  Client   : e-authoring
#
#  Date     : April 23, 2020
#
######################################################################END*/



const preprocessor = require('../utils/processor');
// /*To get the value of other server url details*/
let url_port_details = require('../url_port_details');
/* npm glob,path methods for services */
// let glob = require('glob');
let fs = require('fs');
var moment = require('moment');

var async = require("async");
// let databaseurl = require(url_port_details.dbPath + 'db');
var _ = require('lodash');

async function GetDataForSaveHtml(db_On, dataFolderPath, sql, payLoad) {
    return new Promise(function (resolve, reject) {
        db_On.serialize(function () {
            var dbupdate = false;
            let current_time = moment().format('YYYY-MM-DD, hh:mm:ss a');
            var sql_cnt = `SELECT * FROM correction WHERE ignored_correction = 0`;
            db_On.all(sql_cnt, (err, count) => {
                dbupdate = true;
                var vcount = 0;
                if (count) {
                    vcount = count.length;
                }
                var logcnt = `${payLoad.clientIp} ${current_time}${' File save: File saved successfully,Number of file saved corection '}${vcount}`;
                db_On.all(sql, (err, row) => {
                    if (row.length > 0) {
                        async.forEachOf(row, (value, key) => {
                            db_On.run(`UPDATE correction SET ignored_correction = ? WHERE tagid = ?`, ['1', value.tagid], (err, val) => {
                                if (err) {
                                    process.status(400).status(err);
                                    db_On.close();
                                    process.exit();
                                }
                                else {
                                    if (row.length - 1 == key) {
                                        db_On.run(`UPDATE correction SET ignored_correction = ? WHERE ignored_correction = ?`, ['2', '0'], (err, val) => {
                                            (async () => {
                                                await SaveContentCallBack(dataFolderPath, payLoad, logcnt, dbupdate, db_On);
                                            })();

                                        })

                                    }
                                }
                            })

                        })
                    } else {
                        db_On.run(`UPDATE correction SET ignored_correction = ? WHERE ignored_correction = ?`, ['2', '0'], (err, val) => {
                            (async () => {
                                await SaveContentCallBack(dataFolderPath, payLoad, logcnt, dbupdate, db_On)
                            })();
                        })

                    }
                })
            })
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

async function ReadPath(dataFolderPath, payLoad) {
    return new Promise(function (resolve, reject) {
        let current_time = moment().format('YYYY-MM-DD, hh:mm:ss a');
        fs.writeFile(dataFolderPath.dataFilePath, payLoad.savecontent, function (err) {
            /*error occurs in saving the html content fails*/
            if (err) {
                var logcnt = `${payLoad.clientIp} ${current_time}${' File save: Save operation failed   '}`;
            }
            else {
                var logcnt = `${payLoad.clientIp} ${current_time}${' File save: File saved successfully   '}`;
                // var logcnt = current_time + ' File save: File saved successfully   ';
            }
            fs.readFile(dataFolderPath.dataFilePath, { encoding: 'utf-8' }, function (err, htlm_cnt) {
                resolve(logcnt);
            })
        });
    });
}

async function SaveContentCallBack(dataFolderPath, payLoad, logcnt, dbupdate, db_On) {
    
    db_On.close();

    if (fs.existsSync(dataFolderPath.dataFilePath)) {
        fs.renameSync(dataFolderPath.dataFilePath, dataFolderPath.dataFilePath + '.' + new Date().getTime() + '.bak');
    }
    (async () => {

        let s_c = await ReadPath(dataFolderPath, payLoad);
        if (dbupdate) {
            await preProcessCreateLogFile(logcnt, dataFolderPath);

        } else {
            await preProcessCreateLogFile(s_c, dataFolderPath);

        }
        process.send({ counter: { status: 200, msg: dataFolderPath.dataFilePath } });
        process.exit();
    })();

}


async function Get_updateForCorr_Oxe(db, sql) {
    return new Promise(function (resolve, reject) {
        db.all(sql, (err, row) => {
            resolve(row)
        })
    })
}


async function ForkSaveHtml(payLoad) {
    (async () => {
        const dataFolderPath = await preprocessor.preProcessGetDataFolder(payLoad);
        if (fs.existsSync(dataFolderPath.dataFilePath)) {
            const Generate_Token = { dbtype: payLoad.dbtype, 'tk': { token: payLoad.token } };
            if (payLoad.type == 'bks') {
                var field_name = 'chapterstatus';
                var dbname = 'chapter';
                if (payLoad.chap_no.includes("Chapter") || payLoad.chap_no.includes("PartFrontmatter")) {
                    var g_chap_no = `${'displaynum='}'${payLoad.chap_no.split('_')[0]}' AND ${'idtype='} '${payLoad.chap_no.split('_')[1]}'`;
                } else {
                    var g_chap_no = `${'idtype='} '${payLoad.chap_no}'`;
                }
                const bks_Generate_Token = { dbtype: 'bks', 'tk': { token: payLoad.token } };
                let bks_chap_db_on = preprocessor.preProcessSentToToken(bks_Generate_Token);
                var get_sub_status = `${'SELECT '}${field_name} FROM ${dbname}${' WHERE authormailid = '}'${payLoad.mail_id}' AND ${g_chap_no}`;

                var g_S_Status = await Get_updateForCorr_Oxe(bks_chap_db_on, get_sub_status);
                bks_chap_db_on.close();
            } else {
                var dbname = 'article';
                var field_name = 'submitstatus';
                let jnls_art_db_On = preprocessor.preProcessSentToToken(Generate_Token);

                var get_sub_status = `${'SELECT '}${field_name} FROM ${dbname}${' WHERE authormailid = '}'${payLoad.mail_id}'`;

                var g_S_Status = await Get_updateForCorr_Oxe(jnls_art_db_On, get_sub_status);
                jnls_art_db_On.close();
            }
            if (g_S_Status.length > 0) {
                if (g_S_Status[0][field_name] == 1) {
                        var bks_chap_Crt_db_On = preprocessor.preProcessSentToToken(Generate_Token);
                    let sql = "SELECT tagid FROM correction WHERE function ='undo' AND  ignored_correction ='0'";
                    await GetDataForSaveHtml(bks_chap_Crt_db_On, dataFolderPath, sql, payLoad);
                } else {
                    process.send({ counter: { status: 400, 'msg': `${dbname} is already submited` } });
                    process.exit();

                }
            }
            else {
                process.send({ counter: { status: 400, 'msg': `No records in db` } });
                process.exit();

            }

        }
        else {
            process.send({ counter: { status: 400, 'msg': 'This File is ' + dataFolderPath.dataFilePath + ' not Found' } });
            process.exit();
        }

    })();
}
// receive message from master process
process.on('message', async (message) => {
    await ForkSaveHtml(message);
});