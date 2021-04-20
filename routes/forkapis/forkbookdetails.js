

/*START#############################################
#
#  Purpose  :Fork method js for Forkbookdetails.
#
#  Author   : Indhumathi R
#
#  Client   : E-proofing
#
#  Date     : Nov 15, 2020
#
######################################################################END*/
/*url_port_details.js file for port & other server endpoint details*/
let url_port_details = require('../url_port_details');
const preprocessor = require('../utils/processor');
/* npm glob,path methods for services */
let fs = require('fs');
var _ = require('lodash');
var async = require("async");
let glob = require('glob');
var moment = require('moment');
var current_time = moment().format('YYYY-MM-DD_hh:mm:ss');

function BookPageData(sqlpri, db) {
    return new Promise(function (resolve, reject) {
        db.all(sqlpri, [], (err, row) => {
            if (err)
                reject(err);
            else
                resolve(row);
        })
    })

}



async function ChapterStatusCount(input, bks_opt, db) {
    return new Promise(function (resolve, reject) {
        (async () => {
            bks_opt[0]['chaptersubmitstatus_count'] = 0;
            var sql1 = "SELECT chapterstatus FROM chapter where chapterstatus=1 AND authormailid='" + input.mail_id + "'"
            let opt = await BookPageData(sql1, db)
            bks_opt[0]['chaptersubmitstatus_count'] = opt.length;
            resolve(bks_opt)
        })();
    })
}

async function Getauth_editData(b_opt_f, chap_list_path, vloop) {
    return new Promise(function (resolve, reject) {
        glob(chap_list_path, {}, (err, files) => {
            var supportingArray = [];
            b_opt_f[vloop]['supportingFiles'] = supportingArray;
            files.map(function (val, key) {
                if (val.includes("_Author.pdf") || val.includes("_Editor.pdf")) {
                    b_opt_f[vloop]['download'] = val;
                } else {
                    supportingArray.push(val);

                    b_opt_f[vloop]['supportingFiles'] = supportingArray;
                }

            })
            resolve(b_opt_f)
        })
    })
}

async function GetCountForCorrection(vloop, b_opt_f, input, Auth_Edit, bks_opt, data_Path) {
    return new Promise(function (resolve, reject) {
        (async () => {
            var bks_chap_Details = [];
            const Generate_Token = { dbtype: 'chapter', 'tk': { token: b_opt_f[vloop].token } };
            const chap_db = preprocessor.preProcessSentToToken(Generate_Token);
            var sql_corr = `${'select 1 AS corr_or_not from imganno where authorsequence = '}${b_opt_f[vloop]['authorsequence']} and id is not null union select 1 AS corr_or_not from correction where ignored_correction =2 and authorsequence = ${b_opt_f[vloop]['authorsequence']}`;
            var c_opt = await BookPageData(sql_corr, chap_db);
            var corr_or_not = true;
            if (_.isEmpty(c_opt)) {
                corr_or_not = false;
            }
            b_opt_f[vloop]['corr_or_not'] = corr_or_not;
            if (input.auth_edit) {
                if (input.auth_edit.includes("uthor")) {
                    var varAuth_Edit = "/*(*_DeltaPDF.*|*_Author.*|*_EpsilonPDF.*|*_ESM.*)";
                } else {
                    var varAuth_Edit = "/*(*_DeltaPDF.*|*_Editor.*|*_EpsilonPDF.*|*_ESM.*)";

                }
                var Art_Chap = `${b_opt_f[vloop].displaynum}_${b_opt_f[vloop].idtype}`;
                if (b_opt_f[vloop].idtype) {
                    if (b_opt_f[vloop].idtype.includes("BookFrontmatter") || b_opt_f[vloop].idtype.includes("BookBackmatter")) {
                        Art_Chap = `${b_opt_f[vloop].idtype}`;
                    }
                }
                var chap_list_path = `${data_Path.dataFolder_book}${Art_Chap}/${varAuth_Edit}`;
                await Getauth_editData(b_opt_f, chap_list_path, vloop);
            }
            vloop++;
            if (vloop < b_opt_f.length) {
                await GetCountForCorrection(vloop, b_opt_f, input, Auth_Edit, bks_opt, data_Path)

            }
            if (vloop == b_opt_f.length) {
                chap_db.close();
                if (input.bks_page_log == 'true') {
                    var s_c = `${input.clientIp} ${current_time}, ${'Navigate from home to book page'}.`;
                    await preProcessCreateLogFile(s_c, data_Path);
                }
                await FinalResponse(bks_chap_Details, bks_opt, b_opt_f, Auth_Edit);
            }
        })();
    })
}
async function preProcessCreateLogFile(s_c, LogFile) {
    return new Promise(function (resolve, reject) {
        signalWriteFilePath = `${LogFile.dataFolder_book}${'log.txt'}`;
        if (!fs.existsSync(LogFile.dataFolder_book)) {
            fs.mkdirSync(LogFile.dataFolder_book);
        }

        if (!fs.existsSync(signalWriteFilePath)) {
            fs.writeFile(signalWriteFilePath, s_c, function (err) {
                resolve(LogFile.dataFolder_book);
            })
        }
        else {
            fs.readFile(signalWriteFilePath, { encoding: 'utf-8' }, function (err, htlm_cnt) {
                fs.writeFile(signalWriteFilePath, htlm_cnt + '\n' + s_c, function (err) {
                    resolve(LogFile.dataFolder_book);
                })
            })
        }
    })
}


async function FinalResponse(bks_chap_Details, bks_opt, b_opt_f, Auth_Edit) {
    return new Promise(function (resolve, reject) {
        bks_chap_Details.push({
            'bks_details': bks_opt,
            'chap_details': b_opt_f,
            'auth_edit': Auth_Edit
        })

        process.send({ counter: { status: 200, msg: bks_chap_Details } });
        /* close the database connection  */
        process.exit();
    })
}
async function reproof(input, Generate_Token) {
    return new Promise(function (resolve, reject) {
        (async () => {
            try {
                const bks_bk_db = preprocessor.preProcessSentToToken(Generate_Token);
                const data_Path = await preprocessor.preProcessGetDataFolder(input);
                var bks_chap_Details = [];
                var chaper_num = '1';
                if (input.chap_no) {
                    chaper_num = (input.chap_no).split('_')[0];
                }
                var Auth_Edit = false;
                if (input.stage == 300) {
                    var sql_b = "select * from book group by vendorname";
                } else {
                    var sql_b = "SELECT * FROM book where authormailid='" + input.mail_id + "'";
                }
                var bks_opt = await BookPageData(sql_b, bks_bk_db);
                bks_bk_db.close();
                if (!_.isEmpty(bks_opt)) {

                    const bks_chap_db = preprocessor.preProcessSentToToken(Generate_Token);
                    bks_opt[0].stage = input.stage;
                    if (bks_opt[0].mono == 0) {
                        var frm_url_tkn = bks_opt[0].token;
                        if (bks_opt[0].token == null) {
                            frm_url_tkn = input.token;
                        }
                        if (input.auth_edit) {
                            Auth_Edit = true;
                            var sqlGetChapterList = `${'SELECT DISTINCT idtype,displaynum,chaptertitle,token,authorsequence FROM chapter where displaynum='}${chaper_num} ${'group by displaynum'}`;

                        } else {
                            var sqlGetChapterList = `${'select * from chapter a where authormailid in (select authormailid from chapter where token='}'${frm_url_tkn}') and  exists ( SELECT authorsequence  FROM chapter b WHERE b.chapterstatus=0 AND b.displaynum=a.displaynum and  b.authorsequence < a.authorsequence) or (authorsequence=1 and authormailid in (select authormailid from chapter where token='${frm_url_tkn}'))`;
                            await ChapterStatusCount(input, bks_opt, bks_chap_db);

                        }
                    } else {
                        if (input.auth_edit) {
                            Auth_Edit = true;
                            var sqlGetChapterList = `${"SELECT DISTINCT idtype,displaynum,chaptertitle, token,authorsequence FROM chapter where authorsequence='1'"}`;
                        } else {
                            var sqlGetChapterList = "SELECT * FROM chapter where authormailid='" + input.mail_id + "'";
                            await ChapterStatusCount(input, bks_opt, bks_chap_db);

                        }

                    }
                    bks_chap_db.close();
                    const bks_bk_db = preprocessor.preProcessSentToToken(Generate_Token);
                    var b_opt_f = await BookPageData(sqlGetChapterList, bks_bk_db);
                    bks_bk_db.close();
                    if (!_.isEmpty(b_opt_f)) {
                        if (input.method == 'get') {
                            await GetCountForCorrection(0, b_opt_f, input, Auth_Edit, bks_opt, data_Path)
                        } else {
                            await FinalResponse(bks_chap_Details, bks_opt, b_opt_f, Auth_Edit);
                        }
                    } else {
                        process.send({ counter: { status: 400, msg: `${'No records in book db'}` } });
                        /* close the database connection  */
                        process.exit();
                    }
                } else {
                    process.send({ counter: { status: 400, msg: `${'No records in book db'}` } });
                    /* close the database connection  */
                    process.exit();
                }
            }
            catch (e) {
                console.log(e)
                process.send({ counter: { status: 400, msg: e.toString() } });
                /* close the database connection  */
                process.exit();
            }

        })();
    })
}

async function ForkBookDetails(input) {
    try {
        // open a database connection
        const Generate_Token = { dbtype: input.dbtype, 'tk': { token: input.token } };
        if (input.method == 'post') {
            const bks_chap_db = preprocessor.preProcessSentToToken(Generate_Token);
            let sqlquery = "UPDATE chapter SET chapterstatus = 1 WHERE token='" + input.token + "'";
            await BookPageData(sqlquery, bks_chap_db);
            bks_chap_db.close();

            await reproof(input, Generate_Token)

        } else {

            await reproof(input, Generate_Token)

        }
    }
    catch (e) {
        console.log(e.toString())
        process.send({ counter: { status: 400, msg: e.toString() } });
        /* close the database connection  */
        process.exit();
    }
}


// receive message from master process
process.on('message', async (message) => {
    await ForkBookDetails(message);
});