
/*START#############################################
#
#  Purpose  :Fork method js for imganno.
#
#  Author   : Indhumathi R
#
#  Client   : eproofing
#
#  Date     : Oct 12, 2020
#
######################################################################END*/

const preprocessor = require('../utils/processor');
let fs = require('fs');
var moment = require('moment');
const _ = require('lodash');

function CommomQuery(db, sqlquery, inputData) {
    return new Promise(function (resolve, reject) {
        db.all(sqlquery, inputData, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);

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

async function ForkImganno(payLoad) {
    try {
        let current_time = moment().format('YYYY-MM-DD, hh:mm:ss a');
        const dataFolderPath = await preprocessor.preProcessGetDataFolder(payLoad);
        /*  open a database connection  */
        const Generate_Token = { dbtype: payLoad.dbtype, 'tk': { token: payLoad.token } };
        const db = preprocessor.preProcessSentToToken(Generate_Token);
        var method = payLoad.method;
        var imgannotype = payLoad.imgannotype;
        var get_inputData = [];
        if (payLoad.authorsequence) {
            if (payLoad.imgannotype) {
                var get_aqly = "SELECT * FROM imganno";
            } else {
                if (payLoad.type == 'jnls') {

                    var get_aqly = `${'SELECT * FROM imganno WHERE (authorsequence<='}${payLoad.authorsequence}) AND ((deleteby!=${payLoad.authorsequence} AND deleteby>=${payLoad.authorsequence}) OR deleteby IS NULL)`
                } else {
                    var get_aqly = `${'SELECT * FROM imganno where authorsequence <='}${payLoad.authorsequence}`;

                }

            }

        } else {
            var get_aqly = "SELECT * FROM imganno";
        }
        /*  Get the all data from imganno table */
        if (method === 'get') {
            let opt = await CommomQuery(db, get_aqly, get_inputData);
            db.close();
            process.send({ counter: { status: 200, msg: opt } });
            process.exit();
        } else {
            var width = payLoad.width;
            var height = payLoad.height;
            var left = payLoad.left;
            var top = payLoad.top;
            var test = payLoad.test;
            var id = payLoad.id;

            if (imgannotype === 'insert') {
                inputData = [test, id, payLoad.ImageTagId, top, left, width, height, payLoad.authorsequence];
                var sqlquery = 'INSERT INTO imganno(test, id, ImageTagId, top, left, width, height, authorsequence) VALUES(?, ?, ?, ?, ?, ?, ?, ?)';

                var s_c = `${payLoad.clientIp} ${current_time}${' Image Annotation insert - '} ${'id: '}${id}, ${'ImageTagId: '}${payLoad.ImageTagId}, ${'width: '}${width}, ${'height: '}${height}, ${'left: '}${left},${'top: '}${top} ,${'top: '}${test}, ${'authorsequence: '}${payLoad.authorsequence}.`;
            } else if (imgannotype === 'update') {
                inputData = payLoad.id;
                var sqlquery = 'Select * from imganno where id=?'
                let opt_Auth = await CommomQuery(db, sqlquery, inputData);
                if (!_.isEmpty(opt_Auth)) {
                    if (opt_Auth[0].authorsequence == payLoad.authorsequence) {
                        inputData = [test, width, height, top, left, payLoad.authorsequence, id];
                        var sqlquery = `UPDATE imganno
                                  SET  test = ?, width = ?, height = ?, top = ?, left = ?, authorsequence = ?
                                  WHERE id = ?`;
                    } else {
                        inputData = [payLoad.authorsequence, id, payLoad.oldauthorsequence];
                        var sqlquery = `UPDATE imganno
                            SET  deleteby = ?
                            WHERE id = ? AND authorsequence = ?`;

                        await CommomQuery(db, sqlquery, inputData);

                        var sqlquery = 'INSERT INTO imganno(test, id, ImageTagId, top, left, width, height, authorsequence) VALUES(?, ?, ?, ?, ?, ?, ?, ?)';
                        inputData = [test, id, payLoad.ImageTagId, top, left, width, height, payLoad.authorsequence];
                    }
                }


                var s_c = `${payLoad.clientIp} ${current_time}${' Image Annotation update - '} ${'id: '}${id}, ${'ImageTagId: '}${payLoad.ImageTagId}, ${'width: '}${width}, ${'height: '}${height}, ${'left: '}${left},${'top: '}${top} ,${'top: '}${test} , ${'authorsequence: '}${payLoad.authorsequence}.`;
            } else
                if (imgannotype === 'delete') {
                    inputData = payLoad.id;
                    var s_c = `${payLoad.clientIp} ${current_time}${' Image Annotation delete - '} ${'id: '}${id}, ${'ImageTagId: '}${payLoad.ImageTagId}, ${'width: '}${width}, ${'height: '}${height}, ${'left: '}${left},${'top: '}${top} ,${'top: '}${test}, ${'authorsequence: '}${payLoad.authorsequence}.`;
                    if (payLoad.dbtype == 'jnls') {
                        var sqlquery = 'Select * from imganno where id=?'
                        let opt_Auth = await CommomQuery(db, sqlquery, inputData);
                        if (!_.isEmpty(opt_Auth)) {
                            if (opt_Auth[0].authorsequence == payLoad.authorsequence) {
                                var sqlquery = 'DELETE FROM imganno WHERE id=?';
                            } else {
                                inputData = [payLoad.authorsequence, id];
                                var sqlquery = `UPDATE imganno
                            SET  deleteby = ?
                            WHERE id = ?`;

                            }

                        } else {
                            inputData = [payLoad.authorsequence, id];
                            var sqlquery = `UPDATE imganno
                        SET  deleteby = ?
                        WHERE id = ?`;

                        }

                    } else {
                        var sqlquery = 'DELETE FROM imganno WHERE id=?';


                    }

                }
            await CommomQuery(db, sqlquery, inputData);
            await preProcessCreateLogFile(s_c, dataFolderPath);
            var opt = await CommomQuery(db, get_aqly, get_inputData);
            db.close();
            process.send({ counter: { status: 200, msg: opt } });
            process.exit();

        }
    }
    catch (error) {
        console.log(error.toString())
        process.send({ counter: { status: 400, msg: error.toString() } });
        process.exit();
    }
}

// receive message from master process
process.on('message', async (message) => {
    await ForkImganno(message);
});