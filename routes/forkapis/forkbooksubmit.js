

/*START#############################################
#
#  Purpose  :Fork method js for Forkbooksubmit.
#
#  Author   : Indhumathi R
#
#  Client   : E-Proofing
#
#  Date     : April 21, 2020
#
######################################################################END*/
/*url_port_details.js file for port & other server endpoint details*/
var url_port_details = require('../url_port_details');
const preprocessor = require('../utils/processor');
let fs = require('fs');
var moment = require('moment');
var current_time = moment().format('YYYY-MM-DD_hh:mm:ss');
const nodemailer = require('nodemailer');
let jwtToken = require('../token.js');
var parseString = require('xml2js').parseString;
let js2xmlparser = require("js2xmlparser");
const _ = require('lodash');
var sqlite3 = require('sqlite3').verbose();




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
        var writehtmledir = `${url_port_details.filePath}${url_port_details[payLoad.type]}${'to_production/'}${payLoad.bks_no}-submitted.txt`;
        var to_prod_html = `${payLoad.clientIp} ${current_time}, ${'log.txt file created to production'}`;
        fs.writeFile(writehtmledir, '', function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(to_prod_html);
            }
        })

    })
}
async function Oxe_list_db_update(payLoad) {
    return new Promise(function (resolve, reject) {
        if (payLoad.type == 'bks') {
            sql_db = `${url_port_details.filePath}${url_port_details[payLoad.type]}oxe_list_mpr.data`;
            var db = new sqlite3.Database(sql_db)
            var oxe_sql = `${'UPDATE oxe_list SET received='}'${current_time}' ${'where bookid='}'${payLoad.bks_no}' AND booktype=1 AND ${'authormail='}'${payLoad.mail_id}'`;
        } else {
            sql_db = `${url_port_details.filePath}${url_port_details[payLoad.type]}OXE_List.data`;
            var db = new sqlite3.Database(sql_db);
            var oxe_sql = `${'UPDATE oxe_list SET received='}'${current_time}' ${'where jrnl='}'${payLoad.jnls_no}' AND ${'artno='}'${payLoad.art_no}' AND ${'vendormail='}'${payLoad.mail_id}'`;
        }
        try {
            db.all(oxe_sql, (err, val) => {
                resolve(db);
            })
        } catch (e) {
            console.log(e)

            process.send({ counter: { status: 400, msg: e.toString() } });
            process.exit();

        }
    })

}

async function g_mail_info(bks_info, vend_msg, payLoad, mail_sub_info, data_Path, mail_info) {
    return new Promise(function (resolve, reject) {

        (async () => {
            var Add_MessageContent_auth = (mail_info[0].language == 'En') ? `${'Confirmation mail for Book'} ${mail_info[0].booktitle} (DOI: ${mail_info[0].bookdoi}) ` : `${'Empfangsbestätigung für Buch'} ${mail_info[0].booktitle} (DOI: ${mail_info[0].bookdoi}) `;
            var authormsg_content = (mail_info[0].language == 'En') ? `${'Your corrections have been submitted successfully. We will now process the corrections and finalize your work for publication. Please note that no more corrections may be submitted.'}` : `${'Ihre Korrekturen wurden erfolgreich eingereicht. Diese Korrekturen werden wir jetzt einarbeiten und die Publikation vorbereiten. Wir möchten Sie darauf hinweisen, dass es nicht möglich ist, weitere'} `;
            var author_message_en = `<p style="font:12px arial,sans-serif; color: #333; padding: 5px;">Book: ${mail_info[0].booktitle}.<br />${'DOI : '}${mail_info[0].bookdoi}.<br /><br />${'<p style="font:12px arial,sans-serif; color: #333; padding: 5px;">Dear Author/Editor,<br /><br />'}${authormsg_content}<br /></p><br />Auto Generated Email.<br/>Springer Nature Corrections Team</p><br/></p>`;
            var author_message_ge = `<p style="font:12px arial,sans-serif; color: #333; padding: 5px;">Buch: ${mail_info[0].booktitle}.<br />${'DOI : '}${mail_info[0].bookdoi}.<br /><br />${'<p style="font:12px arial,sans-serif; color: #333; padding: 5px;">Empfangsbestätigung für Kapitel,<br /><br />'}${authormsg_content}<br /></p><br />Auto Generated Email.<br/>Springer Nature Corrections Team</p><br/></p>`;
            var auth_cnt = (mail_info[0].language == 'En') ? author_message_en : author_message_ge;
            var Add_MessageContent_vend = `${'Regarding Book '}${payLoad.bks_no}${' Correction submitted '}${payLoad.mail_id}${'arding'}`
            let Developer_email = url_port_details.Developer_email;
            let Admin_email = url_port_details.Admin_email;
            var mailOptions_Vendor = {
                from: 'eproofing@springernature.com',
                to: mail_info[0].vendormailid,  //send vendor mailid
                bcc: Developer_email + ';' + Admin_email,
                subject: Add_MessageContent_vend,
                html: `${'Dear Team,'}<br><br>${bks_info}<br><br>${vend_msg}`,
            };
            var mailOptions_Author = {
                from: 'eproofing@springernature.com',
                to: mail_info[0].authormailid,  //send vendor mailid
                bcc: Developer_email + ';' + Admin_email, // if jnls == addtional mailid
                subject: Add_MessageContent_auth,
                html: auth_cnt,
            };

            let mail_res_auth = await MailSending(mailOptions_Author, payLoad, mail_sub_info);
            let mail_res_vend = await MailSending(mailOptions_Vendor, payLoad, mail_sub_info);
            let oxe_db = await Oxe_list_db_update(payLoad);
            oxe_db.close();
            await preProcessCreateLogFile(mail_res_auth, data_Path);
            await preProcessCreateLogFile(mail_res_vend, data_Path);
            process.exit();
        })();


    })
}

async function Create_table_info(result, vloop, mail_sub_info, payLoad, mail_info, data_Path) {
    return new Promise(function (resolve, reject) {
        (async () => {
            const Generate_Token = { dbtype: 'chapter', 'tk': { token: mail_sub_info[vloop].token } };
            var db_chap = preprocessor.preProcessSentToToken(Generate_Token);
            let sqlGetCorrectionList = `${"SELECT COUNT( ignored_correction ) as ignored_correction FROM correction WHERE ignored_correction =2 AND"} ${'authorsequence='}${mail_sub_info[vloop].authorsequence}`;
            let next_cor = await Submit_updateInfo(sqlGetCorrectionList, db_chap);
            let sqlGetImageCorrectionList = `${"SELECT count(test) as imgtagcount FROM imganno WHERE id!=' ' AND "} ${'authorsequence='}${mail_sub_info[vloop].authorsequence}`;
            let img_cor = await Submit_updateInfo(sqlGetImageCorrectionList, db_chap);
            result += "<tr>";
            result += "<td>" + mail_sub_info[vloop].displaynum + "</td>";
            result += "<td>" + mail_sub_info[vloop].chaptertitle + "</td>";
            result += "<td>" + next_cor[0].ignored_correction + "</td>";
            result += "<td>" + img_cor[0].imgtagcount + "</td>";
            result += "</tr>";

            vloop++;

            if (vloop < mail_sub_info.length) {
                await Create_table_info(result, vloop, mail_sub_info, payLoad, mail_info, data_Path)

            }
            if (vloop == mail_sub_info.length) {
                db_chap.close();
                let bks_info = '';
                bks_info += `<div><span>${'Book Title : '}${mail_info[0].booktitle}</span></div>`;
                bks_info += `<div><span>${'Series Title : '}${mail_info[0].seriestitle}</span></div>`;
                bks_info += `<div><span>${'ISBN : '}${mail_info[0].isbn}</span></div>`;
                bks_info += `<div><span>${'Edition Number : '}${mail_info[0].editionno}</span></div>`;
                bks_info += `<div><span>${'Book Edition : '}${mail_info[0].bookedition}</span></div>`;
                bks_info += `<br>Book Submitted at Date & Time : ${current_time}<br>`;
                result += "</table><br><br>";
                SubmittedTime = `${current_time}`;
                await g_mail_info(bks_info, result, payLoad, mail_sub_info, data_Path, mail_info);
            }
        })();

    })
}
async function MailSending(g_mailOptions, payLoad, mail_info) {
    console.log('entry MailSending')
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
                var s_c = `${payLoad.clientIp} ${current_time}, ${'Confirmation Mail to author is not send to author'} ${'Mail_id :'} ${mail_info[0].authormailid}.`;
            }
            else {
                var s_c = `${payLoad.clientIp} ${current_time}, ${'Confirmation Mail to author is send to author'} ${'Mail_id :'} ${mail_info[0].authormailid}.`;
                console.log("sucessfully to mail sending")
            }
            resolve(s_c)
        });
    });
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

async function Create_Success_Xml(mail_info, J_A_tag) {
    return new Promise(function (resolve, reject) {
        for (const [key, value] of Object.entries(J_A_tag)) {
            if (key == 'ArticleDOI') {
                J_A_tag[key] = mail_info[0][key.toLocaleLowerCase()];
            }
        }
        resolve(J_A_tag);
    })
}
async function JsonToXml(a_one, mail_info, payLoad, xml_top_data, data_Path, success_xml) {
    return new Promise(function (resolve, reject) {
        (async () => {
            let Status_H = {
                "Status": {
                    '@': { 'code': '40' },
                    '#': 'OXE proof submitted'
                },
                "ProofRecipient": {
                    '@': { 'Role': mail_info[0]['type'], 'CorrectionsRequired': 'Yes' },
                    "Name": mail_info[0]['authorname'],
                    "Email": mail_info[0]['authormailid'],
                    "URL": `${payLoad.url}${payLoad.token}`
                }
            }
            var To_production_Folder = `${url_port_details.filePath}${url_port_details[payLoad.type]}${'to_production/'}`;
            if (a_one.length == 0) {
                xml_top_data['History'] = Status_H
                let to_prod_html = await CopyHtmlToProduction(payLoad, data_Path, To_production_Folder);
                await preProcessCreateLogFile(to_prod_html, data_Path);
            } else {
                var status_R_T = { 'bks_no': payLoad.bks_no, 'chap_no': payLoad.chap_no, 'stage': payLoad.stage, 'type': payLoad.type, 'mail_id': '' };
                status_R_T['mail_id'] = a_one[0]['authormailid'];
                let Status_R = {
                    "Status": {
                        '@': { 'code': '40' },
                        '#': 'OXE proof sent (Success)'
                    },
                    "ProofRecipient": {
                        '@': { 'Role': a_one[0]['type'], 'CorrectionsRequired': 'Yes' },
                        "Name": a_one[0]['authorname'],
                        "Email": a_one[0]['authormailid'],
                        "URL": `${payLoad.url}${a_one[0].token}`
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



async function CopAndWrite_File(data_Path, payLoad, mail_sub_info, vloop, sql_next_author, Generate_Token, J_A_tag, success_xml, mail_info) {
    return new Promise(function (resolve, reject) {
        (async () => {

            const fs = require('fs-extra');
            var Art_Chap = `${mail_sub_info[vloop].displaynum}_${mail_sub_info[vloop].idtype}`;
            if (mail_sub_info[vloop].idtype) {
                if (mail_sub_info[vloop].idtype.includes("BookFrontmatter") || mail_sub_info[vloop].idtype.includes("BookBackmatter")) {
                    Art_Chap = `${mail_sub_info[vloop].idtype}`;
                }
            }

            let newuploadfolder = `${data_Path.dataFolder_book}${Art_Chap}/${'upload_'}${mail_sub_info[vloop]['authorsequence']}`;
            let olduploadfolder = `${data_Path.dataFolder_book}${Art_Chap}/${'upload'}`;

            let writehtmledir = `${data_Path.dataFolder_book}${Art_Chap}/${data_Path.jnls_bks_no}_${Art_Chap}_${mail_sub_info[vloop]['authorsequence']}${'.html'}`;
            var copy_location = `${data_Path.dataFolder_book}${Art_Chap}/${data_Path.jnls_bks_no}_${Art_Chap}${'.html'}`;
            fs.copy(copy_location, writehtmledir, err => {
                if (err) {
                    reject(err);
                } else {

                    if (fs.existsSync(olduploadfolder) && !fs.existsSync(newuploadfolder)) {
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
                    }

                }
            })

            vloop++;
            if (vloop < mail_sub_info.length) {
                await CopAndWrite_File(data_Path, payLoad, mail_sub_info, vloop, sql_next_author, Generate_Token, J_A_tag, success_xml, mail_info);

            }
            if (vloop == mail_sub_info.length) {
                var bks_bks_db = preprocessor.preProcessSentToToken(Generate_Token);
                let a_one = await Submit_updateInfo(sql_next_author, bks_bks_db);
                bks_bks_db.close();
                let xml_top_data = await Create_Success_Xml(mail_info, J_A_tag);
                let res_to_p = await JsonToXml(a_one, mail_info, payLoad, xml_top_data, data_Path, success_xml);
                await preProcessCreateLogFile(res_to_p, data_Path);

                var result = "<table border=1>"
                result += " <tr><th>ChapterID</th><th>ChapterTitle</th><th>Num of text correction</th><th>Num of image correction</th></tr>";
                await Create_table_info(result, 0, mail_sub_info, payLoad, mail_info, data_Path);
            }
        })();

    })

}

async function Jnls_Bks_Chap_submit(Generate_Token, sql_next_author, mail_info, J_A_tag, data_Path, payLoad, success_xml, db_name) {
    return new Promise(function (resolve, reject) {
        (async () => {
            var s_c = `${payLoad.clientIp} ${current_time}, ${db_name} ${'submitted at'} ${current_time} ${'AuthorSequence : '}${mail_info[0]['authorsequence']} .`;
            await preProcessCreateLogFile(s_c, data_Path);
            var bks_chap_db = preprocessor.preProcessSentToToken(Generate_Token);
            let sql_info_sub = `${"select * from "}${'chapter'} ${'where authormailid='}'${payLoad.mail_id}'`;
            let mail_sub_info = await Submit_updateInfo(sql_info_sub, bks_chap_db);
            bks_chap_db.close();

            await CopAndWrite_File(data_Path, payLoad, mail_sub_info, 0, sql_next_author, Generate_Token, J_A_tag, success_xml, mail_info);
        })();
    })
}

async function ForkSubmitChapter(payLoad) {
    try {
        const data_Path = await preprocessor.preProcessGetDataFolder(payLoad);
        const Generate_Token = { dbtype: payLoad.dbtype, 'tk': { token: payLoad.token } };
        var db_name = 'book';
        var J_A_tag = { 'BookID': payLoad.bks_no, 'PrintISBN': '' };
        let sql_mail_info = `${"select * from "}${db_name} ${'where authormailid='}'${payLoad.mail_id}'`;
        let sql_bks = `${'UPDATE'} ${db_name} ${'SET submitstatus=0'} ${'where authormailid='}'${payLoad.mail_id}'`;
        let bookdetails = payLoad.bks_no.split('_');
        var success_xml = `${url_port_details.filePath}${url_port_details[payLoad.type]}${'to_production/Eproof_Success_BookTitleID='}${bookdetails[0]}${'_EditionNumber='}${bookdetails[1]}${'_Language='}${bookdetails[2]}${'_eProof_Mono_'}${moment().format('YYYY-MM-DD_hh_mm_ss')}${'.zip.xml'}`;
        var bks_bks_db = preprocessor.preProcessSentToToken(Generate_Token);
        await Submit_updateInfo(sql_bks, bks_bks_db);
        process.send({ counter: { status: 200, msg: 'Submited' } });
        let mail_info = await Submit_updateInfo(sql_mail_info, bks_bks_db);
        bks_bks_db.close();
        var sql_next_author = `${"select * from "}${db_name} ${'where authorsequence='}${parseInt(mail_info[0]['authorsequence']) + 1}`;
        J_A_tag['PrintISBN'] = mail_info[0]['isbn'];
        await Jnls_Bks_Chap_submit(Generate_Token, sql_next_author, mail_info, J_A_tag, data_Path, payLoad, success_xml, db_name);

        //Backup author corrected HTML file with corrected author sequence number specified in the DB
    } catch (e) {
        console.log(e)
        process.send({ counter: { status: 400, msg: e.toString() } });
        process.exit();
    }
}

// receive message from master process
process.on('message', async (message) => {
    await ForkSubmitChapter(message);
});