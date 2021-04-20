

/*START#############################################
#
#  Purpose  :Fork method js for ForkAQ.
#
#  Author   : Indhumathi R
#
#  Client   : Eproofing
#
#  Date     : Nov 14, 2020
#
######################################################################END*/

const preprocessor = require('../utils/processor');
var moment = require('moment');
let fs = require('fs');
const { values } = require('lodash');

async function Aq_Get_All(db, sql,sucess_msg) {
    return new Promise(function (resolve, reject) {
        db.all(sql, (err, row) => {
            if (sucess_msg == undefined)
                resolve(row);
            else
                resolve(sucess_msg);
        })
    })

}
async function Aq_update(db, sql, inputData, sucess_msg) {
    return new Promise(function (resolve, reject) {
        db.run(sql, inputData, (err, row) => {
            if (sucess_msg == undefined)
                resolve(row);
            else
                resolve(sucess_msg);
        })
    })

}

async function preProcessCreateLogFile(s_c, LogFile) {
    return new Promise(function (resolve, reject) {
        signalWriteFilePath = `${LogFile.dataFolderPath}${'log.txt'}`;
        if (!fs.existsSync(LogFile.dataFolderPath)) {
            fs.mkdirSync(LogFile.dataFolderPath);
        }
        if (!fs.existsSync(signalWriteFilePath)) {
            fs.writeFile(signalWriteFilePath, s_c, function (err) {
                resolve(LogFile.dataFilePath);
            })
        }
        else {
            fs.readFile(signalWriteFilePath, { encoding: 'utf-8' }, function (err, htlm_cnt) {
                fs.writeFile(signalWriteFilePath, htlm_cnt + '\n' + s_c, function (err) {
                    resolve(LogFile.dataFilePath);
                })
            })
        }
    })
}


async function Forkaq(payLoad) {
    try {
        let current_time = moment().format('YYYY-MM-DD, hh:mm:ss a');
        const dataFolderPath = await preprocessor.preProcessGetDataFolder(payLoad);
        const Generate_Token = { dbtype: payLoad.dbtype, 'tk': { token: payLoad.token } };
        var db_On = preprocessor.preProcessSentToToken(Generate_Token);
        var answer = payLoad.answer;
        var id = payLoad.id;
        if (payLoad.listtype == 'aq' && answer == undefined) {
            var sql = "SELECT * FROM query where id='" + id + "'";
            var aq_U = await Aq_Get_All(db_On, sql, sucess_msg);
        } else if (payLoad.listtype == 'aq' && answer !== undefined) {
            var sql = `UPDATE query SET answer = ? WHERE id = ?`;
            var inputData = [answer, id]
            var sucess_msg = `${'aq data is updated'}`;
            var aq_U = await Aq_update(db_On, sql, inputData, sucess_msg);
            var s_c = `${payLoad.clientIp} ${current_time}${' Author query - '} ${'id: '}${id} ${'is updated'}.`;
            await preProcessCreateLogFile(s_c, dataFolderPath);

        } else {
            var sql = "SELECT * FROM query order by id";
            var aq_U = await Aq_Get_All(db_On, sql, sucess_msg);

        }
        process.send({ counter: { status: 200, msg: aq_U } });
        db_On.close();
        process.exit();
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