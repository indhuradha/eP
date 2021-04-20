

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
var url_port_details = require('../url_port_details');
const preprocessor = require('../utils/processor');
let fs = require('fs');
var moment = require('moment');
const nodemailer = require('nodemailer');
let jwtToken = require('../token.js');
var parseString = require('xml2js').parseString;
let js2xmlparser = require("js2xmlparser");
const _ = require('lodash');
var current_time = moment().format('YYYY-MM-DD hh:mm:ss');
var sqlite3 = require('sqlite3').verbose();
var axios = require('axios');
var qs = require('qs');


async function Submit_updateInfo(sql_g, db) {
    return new Promise(function (resolve, reject) {
        db.all(sql_g, (err, val) => {
            resolve(val);
        })
    })
}
async function CopyHtmlToProduction(payLoad, data_Path, writehtmledir) {
    return new Promise(function (resolve, reject) {
        const fs = require('fs-extra');
        let to_P_folder_path = `${url_port_details.filePath}${url_port_details[payLoad.type]}${'to_production/'}`;
        if (!fs.existsSync(to_P_folder_path)) {
            fs.mkdirSync(to_P_folder_path);
        }
        if (payLoad.type == 'jnls') {
            var to_prod_html = `${payLoad.clientIp} ${current_time}, ${'Main html file copied to production'}`;
            fs.copy(data_Path.dataFilePath, writehtmledir, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve(to_prod_html);
                }
            })
        } else {
            var to_prod_html = `${payLoad.clientIp} ${current_time}, ${'log.txt file created to production'}`;

            fs.writeFile(writehtmledir, '', function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(to_prod_html);
                }
            })

        }

    })
}
async function g_mail_info(data_Path, mail_info, UpdateForLog, db_name, payLoad, g_db_isbn) {
    return new Promise(function (resolve, reject) {

        var Add_MessageContent = `${'Regarding'} ${db_name} ${data_Path.jnls_bks_no}/${data_Path.art_chap_no} ${mail_info[0].type} ${mail_info[0].authormailid} ${'Correction Submitted'}`;
        var Doi_mail = '';
        if (mail_info[0].articledoi !== '' && mail_info[0].articledoi !== undefined) {
            Doi_mail = `${mail_info[0].articledoi}`;
        } else if (mail_info[0].chapterdoi !== '' && mail_info[0].chapterdoi !== undefined) {
            Doi_mail = `${mail_info[0].chapterdoi}`;
        }
        if (payLoad.type == 'jnls') {
            var authormsg_content = (g_db_isbn[0].language === 'En') ? "Your corrections have been submitted successfully. We will now process the corrections and finalize your work for publication. Please note that no more corrections may be submitted." : "Ihre Korrekturen wurden erfolgreich eingereicht. Diese Korrekturen werden wir jetzt einarbeiten und die Publikation vorbereiten. Wir möchten Sie darauf hinweisen, dass es nicht möglich ist, weitere Korrekturen abzugeben.";
            var subject = (g_db_isbn[0].language == 'En') ? `${'Confirmation mail for Article'} ${Doi_mail} ` : `${'Empfangsbestätigung für Artikel'} ${Doi_mail} `;
            var vendor_message = `${'File Correction Details: '}${UpdateForLog}<br> ${Doi_mail}<br/> ${'Title : '}${mail_info[0].articletitle}<br> ${'Submitted Time: '}${current_time}<br /><br />Auto Generated Email.<br/>`;
            var author_message_en = `<p style="font:12px arial,sans-serif; color: #333; padding: 5px;">Journal: ${mail_info[0].journalname}.<br />${'DOI : '}${Doi_mail}<br />${'Title : '}${mail_info[0].articletitle}.<br />${'<p style="font:12px arial,sans-serif; color: #333; padding: 5px;">Dear Author,<br /><br />'}${authormsg_content}<br /></p><br />Auto Generated Email.<br/>Springer Nature Corrections Team</p><br/></p>`;
            var author_message_ge = `<p style="font:12px arial,sans-serif; color: #333; padding: 5px;">Zeitschrift: ${mail_info[0].journalname}.<br />${'DOI : '}${Doi_mail}<br />${'Title : '}${mail_info[0].articletitle}.<br />${'<p style="font:12px arial,sans-serif; color: #333; padding: 5px;">Sehr geehrte Damen und Herren,<br /><br />'}${authormsg_content}<br /></p><br />Auto Generated Email.<br/>Springer Nature Corrections Team</p><br/></p>`;
            var author_message = (g_db_isbn[0].language == 'En') ? author_message_en : author_message_ge;
        } else {
            var subject = (g_db_isbn[0].language == 'En') ? `${'Confirmation mail for Chapter'} ${Doi_mail} ${g_db_isbn[0].booktitle}` : `${'Empfangsbestätigung für Kapitel'} ${Doi_mail} `;
            var authormsg_content = (g_db_isbn[0].language === 'En') ? "Your corrections have been submitted successfully. We will now process the corrections and finalize your work for publication. Please note that no more corrections may be submitted." : "Ihre Korrekturen wurden erfolgreich eingereicht. Diese Korrekturen werden wir jetzt einarbeiten und die Publikation vorbereiten. Wir möchten Sie darauf hinweisen, dass es nicht möglich ist, weitere Korrekturen abzugeben.";
            var vendor_message = `${'File Correction Details: '}${UpdateForLog}<br> ${Doi_mail}<br/> ${'Chaptertitle : '}${mail_info[0].chaptertitle}<br> ${'Submitted Time : '}${current_time}<br /><br />Auto Generated Email.<br/>`;
            var author_message_en = `<p style="font:12px arial,sans-serif; color: #333; padding: 5px;">Book: ${g_db_isbn[0].booktitle}.<br />${'DOI : '}${g_db_isbn[0].bookdoi}<br />${'Chapter Title : '}${mail_info[0].chaptertitle}.<br />${'<p style="font:12px arial,sans-serif; color: #333; padding: 5px;">Dear Author/Editor,<br /><br />'}${authormsg_content}<br /></p><br />Auto Generated Email.<br/>Springer Nature Corrections Team</p><br/></p>`;
            var author_message_ge = `<p style="font:12px arial,sans-serif; color: #333; padding: 5px;">Buch: ${g_db_isbn[0].booktitle}.<br />${'DOI : '}${g_db_isbn[0].bookdoi}<br />${'Kapitel : '}${mail_info[0].chaptertitle}.<br />${'<p style="font:12px arial,sans-serif; color: #333; padding: 5px;">Empfangsbestätigung für Kapitel,<br /><br />'}${authormsg_content}<br /></p><br />Auto Generated Email.<br/>Springer Nature Corrections Team</p><br/></p>`;
            var author_message = (g_db_isbn[0].language == 'En') ? author_message_en : author_message_ge;
        }
        let Developer_email = url_port_details.Developer_email;
        let Admin_email = url_port_details.Admin_email;
        var mailOptions_Vendor = {
            from: 'eproofing@springernature.com',
            to: mail_info[0].vendormailid,  //send vendor mailid
            bcc: Developer_email + ';' + Admin_email, // if jnls == addtional mailid
            subject: Add_MessageContent,
            html: vendor_message,
        };
        var mailOptions_Author = {
            from: 'eproofing@springernature.com',
            to: mail_info[0].authormailid,  //send author mailid
            bcc: Developer_email + ';' + Admin_email, // if jnls == addtional mailid
            subject: subject,
            html: author_message,
        };
        mailOptions = {
            'vendor': mailOptions_Vendor,
            'author': mailOptions_Author
        }
        resolve(mailOptions);
    })
}
async function MailSending(g_mailOptions, payLoad, mail_info, auth_vendor) {
    return new Promise(function (resolve, reject) {

        const transporter = nodemailer.createTransport({
            port: 25,
            host: 'localhost',
            tls: {
                rejectUnauthorized: false
            },
        });

        transporter.sendMail(g_mailOptions, (error, info) => {
            if (error) {
                console.log("failed to mail sending")
                var s_c = `${payLoad.clientIp} ${current_time}, ${'Confirmation Mail to '}${auth_vendor} is not send to ${auth_vendor} ${'Mail_id :'} ${mail_info[0].authormailid}.`;
            }
            else {
                var s_c = `${payLoad.clientIp} ${current_time}, ${'Confirmation Mail to '}${auth_vendor} is not send to ${auth_vendor} ${'Mail_id :'} ${mail_info[0].authormailid}.`;
                console.log("sucessfully to mail sending")
            }
            resolve(s_c)
        });
    });
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

async function CopAndWrite_File(data_Path, payLoad) {
    return new Promise(function (resolve, reject) {
        const fs = require('fs-extra');

        let writehtmledir = `${data_Path.dataFolderPath}${(data_Path.data_File_Path).split('.')[0]}${'_'}${payLoad.authorseq}${'.html'}`;
        var copy_location = `${data_Path.dataFilePath}`;
        fs.copy(copy_location, writehtmledir, err => {
            if (err) {
                reject(err);
            } else {

                let olduploadfolder = `${data_Path.dataFolderPath}${'upload'}`;
                let newuploadfolder = `${data_Path.dataFolderPath}${'upload_'}${payLoad.authorseq}`;
                if (fs.existsSync(olduploadfolder)) {
                    if (!fs.existsSync(newuploadfolder)) {
                        fs.renameSync(olduploadfolder, newuploadfolder);
                        fs.mkdirSync(olduploadfolder);
                    } else {
                        var fsd = require('fs-extra');
                        fsd.copySync(olduploadfolder, newuploadfolder);
                        fs.removeSync(olduploadfolder);
                        fs.mkdirSync(olduploadfolder);
                    }
                }
                resolve(olduploadfolder);

            }
        })

    })
}
async function Create_Success_Xml(mail_info, J_A_tag) {
    console.log("--Create_Success_Xml")
    return new Promise(function (resolve, reject) {
        for (const [key, value] of Object.entries(J_A_tag)) {
            if (key == 'ArticleDOI') {
                J_A_tag[key] = mail_info[0][key.toLocaleLowerCase()];
            }
        }
        resolve(J_A_tag);
    })
}
async function JsonToXml(a_one, mail_info, payLoad, status_R_T, xml_top_data, data_Path, writehtmledir, success_xml, g_db_isbn) {
    return new Promise(function (resolve, reject) {
        (async () => {
            var lang_param = '';
            if (g_db_isbn[0].language !== 'En') {
                lang_param = `${'?lang=2'}`
            }
            let Status_H = {
                "Status": {
                    '@': { 'code': '40' },
                    '#': 'OXE proof submitted'
                },
                "ProofRecipient": {
                    '@': { 'Role': mail_info[0]['type'], 'CorrectionsRequired': 'Yes' },
                    "Name": mail_info[0]['authorname'],
                    "Email": mail_info[0]['authormailid'],
                    "URL": `${payLoad.url}${mail_info[0].token}${lang_param}`
                }
            }
            if (a_one.length == 0) {
                xml_top_data['History'] = Status_H
                let to_prod_html = await CopyHtmlToProduction(payLoad, data_Path, writehtmledir);
                await preProcessCreateLogFile(to_prod_html, data_Path);
            } else {
                status_R_T['mail_id'] = a_one[a_one.length - 1]['authormailid'];
                let Status_R = {
                    "Status": {
                        '@': { 'code': '40' },
                        '#': 'OXE proof sent (Success)'
                    },
                    "ProofRecipient": {
                        '@': { 'Role': a_one[a_one.length - 1]['type'], 'CorrectionsRequired': 'Yes' },
                        "Name": a_one[a_one.length - 1]['authorname'],
                        "Email": a_one[a_one.length - 1]['authormailid'],
                        "URL": `${payLoad.url}${a_one[a_one.length - 1].token}${lang_param}`
                    }
                }
                xml_top_data['Response'] = Status_R
                xml_top_data['History'] = Status_H

            }
            var Info_j_to_x = js2xmlparser.parse('eProofResponse', xml_top_data, {
                useSelfClosingTagIfEmpty: false,
                format: { doubleQuotes: true, pretty: false },
                declaration: { include: false }
            });
            var To_production_Folder = `${url_port_details.filePath}${url_port_details[payLoad.type]}${'to_production/'}`;
            Info_j_to_x = Info_j_to_x.replace('<eProofResponse>', '<eProofResponse timestamp="' + current_time + '">');
            if (!fs.existsSync(To_production_Folder)) {
                fs.mkdirSync(To_production_Folder);
            }
            fs.writeFile(success_xml, Info_j_to_x, function (err) {
                if (err) {
                    var to_prod_xml = `${payLoad.clientIp} ${current_time}, ${'Success Signal XML not created \n************************************\n'} ${Info_j_to_x} ${'\n************************************'}`;

                } else {
                    var to_prod_xml = `${payLoad.clientIp} ${current_time}, ${'Success Signal XML created \n************************************\n'} ${Info_j_to_x} ${'\n************************************'}`;
                }
                resolve(to_prod_xml);
            })
        })();
    })
}
async function Oxe_list_db_update(payLoad) {
    return new Promise(function (resolve, reject) {
        if (payLoad.type == 'bks') {
            var g_chap_no = payLoad.chap_no;
            if (payLoad.chap_no.includes("Chapter")) {
                g_chap_no = payLoad.chap_no.split('_')[0];
            }
            sql_db = `${url_port_details.filePath}${url_port_details[payLoad.type]}oxe_list_mpr.data`;
            var db = new sqlite3.Database(sql_db);
            // open the database
            var oxe_sql = `${'UPDATE oxe_list SET received='}'${current_time}' ${'where bookid='}'${payLoad.bks_no}' AND booktype=0 AND ${'chapterid='}'${g_chap_no}' AND ${'authormail='}'${payLoad.mail_id}'`;
        } else {
            sql_db = `${url_port_details.filePath}${url_port_details[payLoad.type]}OXE_List.data`;
            var db = new sqlite3.Database(sql_db);
            // open the database
            var oxe_sql = `${'UPDATE oxe_list SET received='}'${current_time}' ${'where jrnl='}'${payLoad.jnls_no}' AND ${'artno='}'${payLoad.art_no}' AND ${'vendormail='}'${payLoad.mail_id}'`;
        }
        try {
            db.all(oxe_sql, (err, val) => {
                resolve('');
            })
            // close the database connection
            db.close();
        } catch (e) {

            process.send({ counter: { status: 400, msg: e.toString() } });
            process.exit();

        }
    })

}

async function Jnls_Bks_Chap_submit(db_name, J_A_tag, status_R_T, writehtmledir, Generate_Token, data_Path, payLoad, UpdateForLog, sql_mail_info, sql_next_author, success_xml, g_db_isbn) {
    return new Promise(function (resolve, reject) {
        (async () => {
            try {
                /*Get mail info in article | chapter table */
                // open the database
                var chap_chap_db = preprocessor.preProcessSentToToken(Generate_Token);
                let mail_info = await Submit_updateInfo(sql_mail_info, chap_chap_db);
                chap_chap_db.close();
                if (mail_info.length > 0) {
                    var s_c = `${payLoad.clientIp} ${current_time}, ${db_name} ${'submitted at'} ${current_time} ${'AuthorSequence : '}${payLoad.authorseq} .`;
                    await preProcessCreateLogFile(s_c, data_Path);
                    process.send({ counter: { status: 200, msg: 'Submited' } });

                    if (payLoad.stage == 300 || payLoad.type == 'jnls') {

                        let g_mailOptions = await g_mail_info(data_Path, mail_info, UpdateForLog, db_name, payLoad, g_db_isbn);
                        let mail_res_vendor = await MailSending(g_mailOptions.vendor, payLoad, mail_info, 'vendor');
                        await preProcessCreateLogFile(mail_res_vendor, data_Path);
                        let mail_res_author = await MailSending(g_mailOptions.author, payLoad, mail_info, 'author');
                        await preProcessCreateLogFile(mail_res_author, data_Path);
                        await Oxe_list_db_update(payLoad);
                        // open the database
                        let chap_chap_db_on = preprocessor.preProcessSentToToken(Generate_Token);
                        let a_one = await Submit_updateInfo(sql_next_author, chap_chap_db_on);
                        // close the database connection
                        chap_chap_db_on.close();
                        let xml_top_data = await Create_Success_Xml(mail_info, J_A_tag);
                        let res_to_p = await JsonToXml(a_one, mail_info, payLoad, status_R_T, xml_top_data, data_Path, writehtmledir, success_xml, g_db_isbn);

                        await CopAndWrite_File(data_Path, payLoad);
                        await preProcessCreateLogFile(res_to_p, data_Path);
                    }
                    // process.send({ counter: { status: 200, msg: 'Submited' } });
                    process.exit();
                } else {
                    process.send({ counter: { status: 400, msg: 'Issues in token. please provide the valid token' } });
                    process.exit();

                }
            } catch (e) {
                console.log(e.toString())

                process.send({ counter: { status: 400, msg: e.toString() } });
                process.exit();
            }
        })();
    })
}

async function ForkSubmitChapter(payLoad) {
    try {
        const data_Path = await preprocessor.preProcessGetDataFolder(payLoad);
        const Generate_Token = { dbtype: payLoad.dbtype, 'tk': { token: payLoad.token } };
        if (payLoad.correctionval == 1) {
            var UpdateForDb = 1;
            var UpdateForLog = 'No Correction is made';
        } else {
            var UpdateForDb = 0;
            var UpdateForLog = 'Correction is made';
        }
        if (payLoad.type == 'jnls') {
            var db_name = 'article';
            var J_A_tag = { 'JournalID': payLoad.jnls_no, 'ArticleID': payLoad.art_no, 'ArticleDOI': '' };
            var status_R_T = { 'jnls_no': payLoad.jnls_no, 'art_no': payLoad.art_no, 'type': payLoad.type, 'mail_id': '' };
            var sql_g = `${"SELECT count(*) as pending FROM query WHERE answer is NULL or answer=''"}`;

            var writehtmledir = `${url_port_details.filePath}${url_port_details[payLoad.type]}${'to_production/'}${data_Path.data_File_Path}`;
            var success_xml = `${url_port_details.filePath}${url_port_details[payLoad.type]}${'to_production/Eproof_Success_JournalID='}${payLoad.jnls_no}${'_Year='}${data_Path.get_year}${'_ArticleID='}${payLoad.art_no}${'_eProof_'}${moment().format('YYYY-MM-DD_hh-mm-ss')}${'.zip.xml'}`;

            var jnls_query_db = preprocessor.preProcessSentToToken(Generate_Token);
            var queryrow = await Submit_updateInfo(sql_g, jnls_query_db);
            jnls_query_db.close();
            let sql_next_author = `${"select * from "}${db_name} ${'where authorsequence='}${parseInt(payLoad.authorseq) + 1}`;
            let sql_mail_info = `${"select * from "}${db_name} ${'where authorsequence='}${payLoad.authorseq}`;
            /*  open a database connection  */
            if (queryrow[0].pending == 0) {
                var sql_isbn = `${"select language from "}${'article'}`;
                var jnls_art_db = preprocessor.preProcessSentToToken(Generate_Token);
                let sql = `${'UPDATE'} ${db_name} ${'SET submitstatus=0, nocorrection='}${UpdateForDb} ${'where authorsequence='}${payLoad.authorseq}`;
                await Submit_updateInfo(sql, jnls_art_db);
                let g_db_isbn = await Submit_updateInfo(sql_isbn, jnls_art_db);
                jnls_art_db.close();
                await Jnls_Bks_Chap_submit(db_name, J_A_tag, status_R_T, writehtmledir, Generate_Token, data_Path, payLoad, UpdateForLog, sql_mail_info, sql_next_author, success_xml, g_db_isbn);
            } else {
                process.send({ counter: { status: 200, msg: 'Not submitted for author' } });
                process.exit();

            }
        } else {
            var db_name = 'chapter';
            var J_A_tag = { 'BookID': payLoad.bks_no, 'ChapterID': payLoad.chap_no, 'PrintISBN': '' };
            if (payLoad.stage == 300) {
                var writehtmledir = `${url_port_details.filePath}${url_port_details[payLoad.type]}${'to_production/'}${payLoad.bks_no}-${payLoad.chap_no}-submitted.txt`;
            } else {
                var writehtmledir = `${url_port_details.filePath}${url_port_details[payLoad.type]}${'to_production/'}${payLoad.bks_no}-submitted.txt`;
            }
            var status_R_T = { 'bks_no': payLoad.bks_no, 'stage': payLoad.stage, 'type': payLoad.type, 'mail_id': '' };
            let sql_mail_info = `${"select * from "}${db_name} ${'where token='}'${payLoad.token}'`;
            var sql_isbn = `${"select isbn,language,booktitle,bookdoi from "}${'book'}`;

            let sql_bks = `${'UPDATE'} ${db_name} ${'SET chapterstatus=0'} ${'where token='}'${payLoad.token}'`;
            var g_chap_no = payLoad.chap_no;
            if (payLoad.chap_no.includes("Chapter")) {
                g_chap_no = payLoad.chap_no.split('_')[0];
            }

            if (payLoad.bks_no.includes("_")) {
                let bookdetails = payLoad.bks_no.split('_');
                var success_xml = `${url_port_details.filePath}${url_port_details[payLoad.type]}${'to_production/Eproof_Success_BookTitleID='}${bookdetails[0]}${'_EditionNumber='}${bookdetails[1]}${'_Language='}${bookdetails[2]}${'_Chapter='}${g_chap_no}${'_eProof_Contri_'}${moment().format('YYYY-MM-DD_hh-mm-ss')}${'.zip.xml'}`;
            } else {
                var success_xml = `${url_port_details.filePath}${url_port_details[payLoad.type]}${'to_production/Eproof_Success_SeriesID='}${bookdetails[0]}${'_Chapter='}${g_chap_no}${'_eProof_Contri_'}${moment().format('YYYY-MM-DD_hh-mm-ss')}${'.zip.xml'}`;
            }
            var sql_next_author = `${"select * from "}${db_name} ${'where authorsequence>'}${payLoad.authorseq} AND ${'displaynum='}'${g_chap_no}' order by authorsequence limit 1`;
            /*chapter | submit status is updated in chapter | article table */
            var chap_chap_db = preprocessor.preProcessSentToToken(Generate_Token);
            await Submit_updateInfo(sql_bks, chap_chap_db);
            chap_chap_db.close();
            /*Get isbn for book table */
            var chap_bks_db = preprocessor.preProcessSentToToken(Generate_Token);
            let g_db_isbn = await Submit_updateInfo(sql_isbn, chap_bks_db);
            chap_bks_db.close();
            if (g_db_isbn.length > 0) {
                J_A_tag['PrintISBN'] = g_db_isbn[0]['isbn'];
            } else {
                J_A_tag['PrintISBN'] = ''; g_db_isbn['language'] = ''; g_db_isbn['booktitle'] = ''; g_db_isbn['bookdoi'] = '';
            }
            await Jnls_Bks_Chap_submit(db_name, J_A_tag, status_R_T, writehtmledir, Generate_Token, data_Path, payLoad, UpdateForLog, sql_mail_info, sql_next_author, success_xml, g_db_isbn);

        }
        //Backup author corrected HTML file with corrected author sequence number specified in the DB
    } catch (e) {
        console.log(e.toString())

        process.send({ counter: { status: 400, msg: e.toString() } });
        process.exit();
    }
}

// receive message from master process
process.on('message', async (message) => {
    await ForkSubmitChapter(message);
});