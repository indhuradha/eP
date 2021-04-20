
/*START#############################################
#
#  Purpose  :Fork method js for gethtml.
#
#  Author   : Indhumathi R
#
#  Client   : E-authoring
#
#  Date     : April 21, 2020
#
######################################################################END*/
/*url_port_details.js file for port & other server endpoint details*/
// let url_port_details = require('../url_port_details');
const preprocessor = require('../utils/processor');
/* npm glob,path methods for services */
let fs = require('fs');
var moment = require('moment');

async function ReadPath(dataFolderPath, payLoad) {
    return new Promise(function (resolve, reject) {
        fs.readFile(dataFolderPath.dataFilePath, { encoding: 'utf-8' }, function (err, content) {
            resolve(content);
        })
    })
}

async function ArticleInfo_Insert(db, sql, End_data, flag) {
    return new Promise(function (resolve, reject) {
        db.all(sql, (err, val) => {
            if (val) {
                if (val.length > 0) {
                    for (const [key, value] of Object.entries(val[0])) {
                        End_data[0][key] = value;
                    }
                }
            }
            if (flag == false && val.length == 0) {
                resolve([]);

            } else {

                resolve(End_data);
            }
        })
    })
}
async function ArticleInfo_update(db, sql, A_inp, End_data, flag) {
    return new Promise(function (resolve, reject) {
        db.run(sql, A_inp, (err, val) => {
            if (flag == false && val.length == 0) {
                resolve([]);

            } else {

                resolve(End_data);
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


async function ForkGetHtml(payLoad) {
    var End_data = [];
    const dataFolderPath = await preprocessor.preProcessGetDataFolder(payLoad);
    if (fs.existsSync(dataFolderPath.dataFilePath)) {
        const Generate_Token = { dbtype: payLoad.dbtype, 'tk': { token: payLoad.token } };
        try {
            End_data.push(payLoad)
            let Bks_Crt_qry_upt = `UPDATE correction SET ignored_correction = ? WHERE ignored_correction = ?`;
            let Bks_Crt_qry = `SELECT  count(*) as Correction_Count FROM correction WHERE ignored_correction = 0`;
            let A_inp = ['1', '0'];
            const Bks_Crt_db_On = preprocessor.preProcessSentToToken(Generate_Token);
            let get_correction = await ArticleInfo_Insert(Bks_Crt_db_On, Bks_Crt_qry, End_data, true);
            Bks_Crt_db_On.close();
            if (payLoad.type == 'bks') {
                var displaynum = (payLoad.chap_no).split('_')[0];
                if (payLoad.chap_no.includes("Chapter") || payLoad.chap_no.includes("PartFrontmatter")) {
                    var displaynum = (payLoad.chap_no).split('_')[0];
                    var idtype = (payLoad.chap_no).split('_')[1];
                } else {
                    var displaynum = '';
                    var idtype = (payLoad.chap_no).split('_')[0];

                }

                var Bks_ChaporArt_db_On = "SELECT * FROM chapter where authormailid='" + payLoad.mail_id + "' and displaynum = '" + displaynum + "' and idtype = '" + idtype + "'";

                const Generate_Token = { dbtype: 'chapter', 'tk': { token: payLoad.token } };
                const Bks_Crt_db_On = preprocessor.preProcessSentToToken(Generate_Token);

                await ArticleInfo_update(Bks_Crt_db_On, Bks_Crt_qry_upt, A_inp, End_data, true);
                Bks_Crt_db_On.close();
                if (payLoad.stage == 300) {
                    var sql_mail_mrw = "SELECT mrwchapter FROM chapter where authormailid='" + payLoad.mail_id + "'";
                    const Generate_Token = { dbtype: 'chapter', 'tk': { token: payLoad.token } };
                    const Bks_Chap_Chp_db_On = preprocessor.preProcessSentToToken(Generate_Token);
                    await ArticleInfo_Insert(Bks_Chap_Chp_db_On, sql_mail_mrw, End_data, true);
                    Bks_Chap_Chp_db_On.close();
                }
            } else {
                var Bks_ChaporArt_db_On = "SELECT articledoi,articletitle,authormailid,authorsequence,submitstatus FROM article where authormailid='" + payLoad.mail_id + "'";

                const Bks_Crt_db_On = preprocessor.preProcessSentToToken(Generate_Token);
                await ArticleInfo_update(Bks_Crt_db_On, Bks_Crt_qry_upt, A_inp, End_data, true);
                Bks_Crt_db_On.close();
            }

            const Bks_Chap_db_On = preprocessor.preProcessSentToToken(Generate_Token);
            var vali_opt = await ArticleInfo_Insert(Bks_Chap_db_On, Bks_ChaporArt_db_On, End_data, false);
            Bks_Chap_db_On.close();
            if (vali_opt.length == 0) {
                process.send({ counter: { status: 400, msg: 'Issues in token. Please provide the valid token' } });
                process.exit();


            } else {
                let html_cnt = await ReadPath(dataFolderPath, payLoad);
                let current_time = moment().format('YYYY-MM-DD, hh:mm:ss a');
                var vCorrection_Count = get_correction[0].Correction_Count;
                if (get_correction[0].Correction_Count == undefined) {
                    vCorrection_Count = 0;
                }
                let s_c = `${payLoad.clientIp} ${current_time} ${payLoad.mail_id}${' MainPage'} ${'No of ignored corrections: '}${vCorrection_Count}\n`,
                    s_c_bro_info = s_c + `${payLoad.clientIp} ${current_time} ${'browser:'} ${payLoad.useragent.browser},${'version:'} ${payLoad.useragent.version}, ${'os:'} ${payLoad.useragent.os},${'platform:'} ${payLoad.useragent.platform},${'source:'} ${payLoad.useragent.source}`;
               if (payLoad.bks_page_log == 'true') {
                        var s_c_bks = `${payLoad.clientIp} ${current_time}, ${'Navigate from book page to main page'}.`;
                        await preProcessCreateLogFile(s_c_bks, dataFolderPath);
                    }
                    await preProcessCreateLogFile(s_c_bro_info, dataFolderPath);
               
                process.send({ counter: { status: 200, msg: { content: html_cnt, End_data } } });

            }
        } catch (e) {
            console.log(e.toString())
            process.send({ counter: { status: 400, msg: e.toString() } });
            process.exit();

        }
    } else {
        process.send({ counter: { status: 400, 'msg': 'Folder/File not available for this token' } });
        setTimeout(function () { process.exit(); }, 1000);
    }

}

// receive message from master process
process.on('message', async (message) => {
    await ForkGetHtml(message)
});

