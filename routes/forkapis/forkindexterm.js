
/*START#############################################
#
#  Purpose  :Fork method js for forkIndexTerm.
#
#  Author   : Indhumathi R
#
#  Client   : e-authoring
#
#  Date     : April 27, 2020
#
######################################################################END*/

let fs = require('fs');
var _ = require('lodash');
const preprocessor = require('../utils/processor');
var moment = require('moment');

function CommomForIndexterm(sqlpri, db, inputData) {
    return new Promise(function (resolve, reject) {
        db.all(sqlpri, inputData, (err, row) => {
            if (err) {
                reject(row);
            } else {
                resolve(row);
            }
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


async function ForkIndexTerm(payLoad) {
    try {
        const dataFolderPath = await preprocessor.preProcessGetDataFolder(payLoad);
        let current_time = moment().format('YYYY-MM-DD, hh:mm:ss a');

        if (fs.existsSync(dataFolderPath.dataFolder_book)) {
            // open a database connection
            const Generate_Token = { dbtype: payLoad.dbtype, 'tk': { token: payLoad.token } };
            const db = preprocessor.preProcessSentToToken(Generate_Token);
            var indextermtype = payLoad.indextermtype;
            var signalWriteFilePath = dataFolderPath.dataFolderPath + 'log.txt';
            var getIndexTerm = [];
            if (indextermtype == 'getIndexTerm') {
                var inputData = [];
                let sqlpri = "SELECT DISTINCT primaryterm FROM indextable where status!=3 AND primaryterm IS NOT NULL";
                let sqlsec = "SELECT DISTINCT secondaryterm FROM indextable where status!=3  AND secondaryterm IS NOT NULL";
                let sqlPriAns = await CommomForIndexterm(sqlpri, db, inputData);
                getIndexTerm.push(sqlPriAns)
                let sqlSecAns = await CommomForIndexterm(sqlsec, db, inputData);
                getIndexTerm.push(sqlSecAns)
                process.send({ counter: { status: 200, msg: getIndexTerm } });
                db.close();
                process.exit();

            }
            else if (indextermtype === 'insert') {
                let chapterid = (payLoad.chap_no).split('_')[0];
                var status = 1;
                let inputData = [payLoad.primaryterm, payLoad.secondaryterm, payLoad.tertiaryterm, payLoad.seeterm, payLoad.seealsoterm, chapterid, payLoad.token, status];

                let sqlpri = 'INSERT INTO indextable(primaryterm, secondaryterm, tertiaryterm, seeterm, seealsoterm, chapterid ,token, status) VALUES(?, ?, ?, ?, ?, ? ,? ,?)';
                await CommomForIndexterm(sqlpri, db, inputData);
                let sqlsec = 'SELECT id FROM indextable ORDER BY id DESC LIMIT 1';
                let inputData2 = [];
                let sqlSecAns = await CommomForIndexterm(sqlsec, db, inputData2);
                if (!_.isEmpty(sqlSecAns)) {
                    var s_c = `${payLoad.clientIp} ${current_time} ${'Added new index term.'} ${'Primary term: '} ${payLoad.primaryterm}, ${'secondaryterm: '} ${payLoad.secondaryterm}, ${'tertiary term: '} ${payLoad.tertiaryterm}, ${'Index term id: '} ${sqlSecAns[0].id}.`;
                } else {
                    var s_c = `${payLoad.clientIp} ${current_time}${' Indexterm is failed to insert - '} .`;
                }
                await preProcessCreateLogFile(s_c, dataFolderPath);
                process.send({ counter: { status: 200, msg: sqlSecAns } });
                db.close();
                process.exit();
            }
            else if (indextermtype === 'edit') {
                let chapterid = (payLoad.chap_no).split('_')[0];
                var status = 1;
                var inputData = [payLoad.primaryterm, payLoad.secondaryterm, payLoad.tertiaryterm, payLoad.seeterm, payLoad.seealsoterm, chapterid, payLoad.token, status, payLoad.id];
                let sql = `UPDATE indextable
            SET primaryterm = ?, secondaryterm = ?, tertiaryterm = ?, seeterm = ?, seealsoterm = ?,chapterid = ?, token = ?, status = ?
            WHERE id = ?`;
                let sqlSecAns = await CommomForIndexterm(sql, db, inputData);
                if (sqlSecAns.length == 0) {
                    var s_c = `${payLoad.clientIp} ${current_time} ${'Updated index term.'} ${'Primary term: '} ${payLoad.primaryterm}, ${'secondaryterm: '} ${payLoad.secondaryterm}, ${'tertiary term: '} ${payLoad.tertiaryterm}, ${'Index term id: '} ${payLoad.id}.`;
                } else {
                    var s_c = `${payLoad.clientIp} ${current_time} ${' Indexterm is failed to Edit - '} .`;
                }
                await preProcessCreateLogFile(s_c, dataFolderPath);
                process.send({ counter: { status: 200, msg: sqlSecAns } });
                db.close();
                process.exit();

            }
            else if (indextermtype === 'delete') {
                var termtype = payLoad.termtype;
                var term = payLoad.term;
                var id = payLoad.id;
                if (termtype == 'Primary') {
                    var sql = "SELECT * FROM indextable where primaryterm='" + term + "' AND status !=3 AND secondaryterm IS NOT NULL";
                } else {
                    var sql = "SELECT * FROM indextable where secondaryterm='" + term + "' AND status !=3 AND tertiaryterm IS NOT NULL";

                }

                let inputDatas = [];
                let sqlSecAns = await CommomForIndexterm(sql, db, inputDatas);
                if (sqlSecAns.length > 0) {
                    var s_c = `${payLoad.clientIp} ${current_time}${" Can't delete row - "}.`;
                    await preProcessCreateLogFile(s_c, dataFolderPath);
                    process.send({ counter: { status: 200, msg: `${"Can't delete row"}` } });
                    db.close();
                    process.exit();

                } else {

                    var inputData = ['3', id];
                    let sql = `UPDATE indextable SET status = ? WHERE id = ?`
                    let sqlSec = await CommomForIndexterm(sql, db, inputData);
                    if (sqlSec.length == 0) {
                        var finaldata = `${"status is updated sucessfully"}`;
                        var s_c = `${payLoad.clientIp} ${current_time} ${' Deleted Index term - '} ${'id:'} ${id}  .`;
                    } else {
                        var finaldata = `${"Can't delete row"}`;
                        var s_c = `${payLoad.clientIp} ${current_time} ${' Indexterm is failed to delete - '} .`;
                    }
                    await preProcessCreateLogFile(s_c, dataFolderPath);
                    process.send({ counter: { status: 200, msg: finaldata } });
                    db.close();
                    process.exit();
                }
            }
        }
        else {
            process.send({ counter: { status: 400, msg: 'File is not exits in this path ' + dataFolderPath.dataFolder_book } });
            process.exit();
        }
    }
    catch (error) {
        process.send({ counter: { status: 400, msg: error.toString() } });
        process.exit();
    }
}

// receive message from master process
process.on('message', async (message) => {
    await ForkIndexTerm(message);
});