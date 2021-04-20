

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
var fs = require('fs');
let image_anno = require('../functions');
// let index = require('../index.css');
var exe = require('child_process').exec;
var moment = require('moment');
const nodemailer = require('nodemailer');
var current_time = moment().format('YYYY-MM-DD_hh:mm:ss');
const axios = require('axios').default;
var header = `<html><head><META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=utf-8"><meta name="Robots" content="NOINDEX " /> <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=default"></script> <script src="http://eproofing-dev.springernature.com:3003/ePj/js/mathjax.config.js"></script> <script src="https://code.jquery.com/jquery-2.2.4.min.js" crossorigin="anonymous"></script></head><body>`;
// var header = `<html><head><META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=utf-8"><meta name="Robots" content="NOINDEX " /> <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=default"></script> <script src="http://eproofing-dev.springernature.com:3003/ePj/js/mathjax.config.js"></script> <script src="https://code.jquery.com/jquery-2.2.4.min.js" crossorigin="anonymous"></script></head><body>`;
var successstatus = { 'Status': 'success', 'Code': 200, 'Msg': `Generate pdf created successfully` };
var fivehunstatus = { 'Status': 'failed', 'Code': 500, 'Msg': `Error while generating PDF` };

async function ReadPath(path) {
    return new Promise(function (resolve, reject) {
        fs.readFile(path, { encoding: 'utf-8' }, function (err, content) {
            resolve(content);
        })
    })
}
async function AuthorName_info(sql_mail_info, db) {
    return new Promise(function (resolve, reject) {
        db.all(sql_mail_info, (err, val) => {
            resolve(val);
        })
    })
}
async function g_mail_info(data_Path, mail_info, copy_paste_pdf, payLoad, Sucess_Err) {
    return new Promise(function (resolve, reject) {
        console.log("entry mail info function")
        var authorname = '';
        if (mail_info) {
            if (mail_info.length > 0)
                authorname = mail_info[0].authorname;

        }
        var Add_MessageContent = `${'Regarding'} ${Sucess_Err} Author Feedback PDF for ${data_Path.jnls_bks_no}/${data_Path.art_chap_no}`;
        var author_message = `${Sucess_Err} ${'Attached is the Feedback PDF of ('}${authorname}${') for '}${data_Path.jnls_bks_no}/${data_Path.art_chap_no}`;
        let Developer_email = url_port_details.Developer_email;
        let Admin_email = url_port_details.Admin_email;
        var mailOptions = {
            from: 'eproofing@springernature.com',
            to: mail_info[0].Authormailid,
            bcc: Developer_email + ';' + Admin_email,
            subject: Add_MessageContent,
            html: author_message,
            attachments: [
                {   // utf-8 string as an attachment
                    filename: `${data_Path.data_pdf_Path}_${payLoad.authorseq}.pdf`,
                    content: fs.createReadStream(copy_paste_pdf)
                },
            ]
        };
        resolve(mailOptions);
    })
}

async function MailSending(g_mailOptions, payLoad) {
    return new Promise(function (resolve, reject) {
        console.log("entry sending function")

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
                var s_c = `${payLoad.clientIp} ${current_time}, ${'Confirmation Mail to author is not send to author'} ${'Mail_id :'} ${payLoad.mail_id}.`;
            }
            else {
                var s_c = `${payLoad.clientIp} ${current_time}, ${'Confirmation Mail to author is send to author'} ${'Mail_id :'} ${payLoad.mail_id}.`;
                console.log("sucessfully to mail sending")
            }
            resolve(s_c)
        });
    });
}

async function preProcessCreateLogFile(s_c, LogFile) {
    return new Promise(function (resolve, reject) {
        console.log("entry log function")
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

async function CopyTemPathToDir(temp_pdf_path, copy_paste_pdf) {
    return new Promise(function (resolve, reject) {
        const fs = require('fs-extra');
        if (!fs.existsSync(copy_paste_pdf)) {
            fs.copy(`${temp_pdf_path}`, copy_paste_pdf);
            resolve(copy_paste_pdf);
        } else {
            resolve(copy_paste_pdf);

        }
    })
}
async function CreatepdfToTemPath(cmd, temp_pdf_path) {
    return new Promise(function (resolve, reject) {

        exe(cmd, (error, stdout, stderr) => {
            if (fs.existsSync(`${temp_pdf_path}`)) {
                resolve(temp_pdf_path);
            }
            else {
                resolve(500);
            }
        });
    })
}



async function GetPdfGeneration(data_Path, sql_mail_info, Generate_Token, payLoad, f_pdf_path, Sucess_Err) {
    return new Promise(function (resolve, reject) {
        (async () => {
            try {

                var chap_db = preprocessor.preProcessSentToToken(Generate_Token);
                let mail_info = await AuthorName_info(sql_mail_info, chap_db);
                chap_db.close();
                let g_mailOptions = await g_mail_info(data_Path, mail_info, f_pdf_path, payLoad, Sucess_Err);
                let mail_res = await MailSending(g_mailOptions, payLoad);
                await preProcessCreateLogFile(mail_res, data_Path);
                resolve(g_mailOptions);

            } catch (e) {
                console.log(e.toString())

                process.send({ counter: { status: 400, msg: e.toString() } });
                process.exit();
            }
        })();
    })
}


async function ForkConvertPdf(payLoad) {
    const data_Path = await preprocessor.preProcessGetDataFolder(payLoad);
    var path = `${data_Path.dataFolderPath}${(data_Path.data_File_Path).split('.')[0]}${'_'}${payLoad.authorseq}${'.html'}`;

    var temp = `${url_port_details.filePath}${url_port_details[payLoad.type]}temp/${uniqueID()}/`;
    let temp_pdf_path = `${temp}${data_Path.data_pdf_Path}_${payLoad.authorseq}.pdf`;
    var copy_paste_pdf = `${data_Path.dataFolderPath}${data_Path.data_pdf_Path}_${payLoad.authorseq}.pdf`;
    if (payLoad.type == 'jnls') {
        var db_name = 'article';
        var sql_mail_info = `${"select * from "}${db_name} ${'where authorsequence='}${payLoad.authorseq}`;
    } else {
        var db_name = 'chapter';
        var sql_mail_info = `${"select * from "}${db_name} ${'where token='}'${payLoad.token}'`;

    }

    const Generate_Token = { dbtype: payLoad.dbtype, 'tk': { token: payLoad.token } };
    if (fs.existsSync(copy_paste_pdf) && payLoad.email == 'yes') {
        (async () => {
            let Sucess_Err = '';
            let f_pdf_path = await CopyTemPathToDir(temp_pdf_path, copy_paste_pdf);
            process.send({ counter: { status: 200, msg: successstatus } });
            await GetPdfGeneration(data_Path, sql_mail_info, db, payLoad, f_pdf_path, Sucess_Err);

            process.exit();
        })();

    } else {
        try {


            fs.mkdirSync(temp, { recursive: true });
            if (payLoad.email == 'yes') {
                process.send({ counter: { status: 200, msg: successstatus } });
            }
            let data = await ReadPath(path);
            var feedback = await buildElement(Object.assign(payLoad), Generate_Token);

            var htmltempreq = `const BaseUrl = '${url_port_details.refPDFRecal}'; var object = { 'token': '${payLoad.token}',authorsequence:'${payLoad.authorseq}', dbtype: '${payLoad.dbtype}', method: 'get','Forkapipath': 'forkimganno' };  $.ajax({ url: '${url_port_details.refPDFRecal}/imganno', type: "get",data: object, success: function(response) {Imagecanvas(response, object.token);},error: function(xhr) {console.log(xhr);}}); `;
            var footer = fs.readFileSync(url_port_details.footerPath + "footer.txt", { encoding: "utf8" });

            var script = htmltempreq + "\n" + fs.readFileSync(url_port_details.footerPath + 'image_anno.js', { encoding: "utf8" });

            var html_content = header + "\n" + feedback + "\n" + data + "\n" + `<script>${script}</script>` + "\n" + footer;
            fs.writeFileSync(temp + "data.html", html_content);
            if (payLoad.email == 'yes') {

                var cmd = `wkhtmltopdf  ${temp}data.html --user-style-sheet ${url_port_details.footerPath}index.css  --debug-javascript --javascript-delay 10000  --enable-local-file-access --enable-plugins --no-stop-slow-scripts ${temp_pdf_path}`

                let Tem_pdf_path = await CreatepdfToTemPath(cmd, temp_pdf_path);
                if (Tem_pdf_path == 500) {
                    let Sucess_Err = 'Error in Creating';
                    await GetPdfGeneration(data_Path, sql_mail_info, Generate_Token, payLoad, f_pdf_path, Sucess_Err);
                    db.close();
                    process.exit();

                } else {
                    let Sucess_Err = '';
                    let f_pdf_path = await CopyTemPathToDir(temp_pdf_path, copy_paste_pdf);
                    if (!fs.existsSync(copy_paste_pdf)) {
                        await CreatepdfToTemPath(cmd, temp_pdf_path);
                        await GetPdfGeneration(data_Path, sql_mail_info, Generate_Token, payLoad, f_pdf_path, Sucess_Err);
                        removetempFile(temp);
                        db.close();
                        process.exit();

                    } else {
                        await GetPdfGeneration(data_Path, sql_mail_info, Generate_Token, payLoad, f_pdf_path, Sucess_Err);
                        removetempFile(temp);
                        db.close();
                        process.exit();

                    }

                }
            } else {
                process.send({ counter: { status: 200, msg: { 'Status': 'success', 'Code': 200, 'htmlPath': temp + "data.html" } } });
                db.close();
                process.exit();

            }

            process.on("finish", () => {
                removetempFile(temp);
            })
        } catch (e) {
            process.send({ counter: { status: 500, msg: e.toString() } });
            process.exit(); e.toString()
        }
    }
}

function removetempFile(path) {
    if (fs.existsSync(path)) {
        const files = fs.readdirSync(path)
        if (files.length > 0) {
            files.forEach(function (filename) {
                if (fs.statSync(path + "/" + filename).isDirectory()) {
                    removetempFile(path + "/" + filename);
                } else {
                    fs.unlinkSync(path + "/" + filename)
                }
            })
            fs.rmdirSync(path)
        } else {
            fs.rmdirSync(path)
        }
    }

}

function uniqueID() {
    return Math.floor(Math.random() * new Date().getTime()).toString(16);
}

function buildElement(data, Generate_Token) {
    try {
        var createElement = require('../createElement');
        return new Promise(async (r) => {
            var db = preprocessor.preProcessSentToToken(Generate_Token);
            var correction_query = `${'SELECT * FROM correction where authorsequence ='}${data.authorseq} AND ignored_correction=2`;
            if (data.type == 'jnls') {
                var Imaganno_aqly = `${'SELECT * FROM imganno WHERE (authorsequence='}${data.authorseq}) AND ((deleteby!=${data.authorseq} AND deleteby>=${data.authorseq}) OR deleteby IS NULL)`
            } else {
                var Imaganno_aqly = `${'SELECT * FROM imganno where authorsequence ='}${data.authorseq}`;

            }
            var Aq_query = "SELECT * FROM query order by id";
            var html = "";
            var crt_db = preprocessor.preProcessSentToToken(Generate_Token);
            let Crt_info = await AuthorName_info(correction_query, crt_db);
            crt_db.close();
            html += await createElement.FileCorrectionDetails(data, Crt_info);
            var img_db = preprocessor.preProcessSentToToken(Generate_Token);
            let Imag_info = await AuthorName_info(Imaganno_aqly, img_db);
            img_db.close();
            html += await createElement.ImageAnnotationDetails(Imag_info);
            var qry_db = preprocessor.preProcessSentToToken(Generate_Token);
            let Aq_info = await AuthorName_info(Aq_query, qry_db);
            qry_db.close();
            html += await createElement.AttachedFileDetails(data);
            html += await createElement.QueryDetails(Aq_info);
            html += "<hr><br>"
            r(html);
        });
    } catch (e) {
        console.log(e.toString())
        process.send({ counter: { status: 500, msg: e.toString() } });
        process.exit();
    }
}


// receive message from master process
process.on('message', async (message) => {
    await ForkConvertPdf(message)
});
