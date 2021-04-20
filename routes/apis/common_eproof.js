

const preprocessor = require('../utils/processor');
/* url_port_details.js file for port & other server endpoint details */
let url_port_details = require('../url_port_details');
const { fork } = require('child_process');
const requestIp = require('request-ip');
const _ = require('lodash');
var fs = require('fs');
let glob = require('glob');

const options = {
    explicitArray: false, explicitCharkey: false, trim: true,
    attrkey: '@', preserveChildrenOrder: true, explicitRoot: true
}

async function preProcessForEproof(req, res, query_body) {
    return new Promise(function (resolve, reject) {
        const clientIp = requestIp.getClientIp(req);
        const forkJsUrl = `${url_port_details.forkPath}${query_body.Forkapipath}${'.js'}`;
        if (query_body.Forkapipath == 'forkgetMath' || query_body.Forkapipath == 'forkpackagegenerate' || query_body.Forkapipath == 'forkvendorlist' || query_body.Forkapipath == 'forkgetMath') {
            var input = {
                data: query_body
            };

        } else {

            var Token = {
                'tk': query_body, 'clientIp': clientIp
            }

            var input = preprocessor.preProcessSentToToken(Token);

        }

        if (input !== 'Invalid Token') {


            /* fork another process */
            const process = fork(forkJsUrl);

            if (forkJsUrl.includes("forkgethtml")) {
                let user_agent = {
                    'browser': req.useragent.browser,
                    'version': req.useragent.version,
                    'os': req.useragent.os,
                    'platform': req.useragent.platform,
                    'source': req.useragent.source
                }
                input['useragent'] = user_agent;
            } else if (forkJsUrl.includes("forkupload")) {
                input.fields = query_body.i_fields;
                input.files = query_body.i_files;
            }

            /* send list of inputs to forked process */
            process.send(input);
            // listen for messages from forked process
            process.on('message', (message) => {
                if (message) {
                    if (message.counter.status == 200) {
                        if (forkJsUrl.includes("forksavehtml")) {
                            let path = require('path');

                            res.download(message.counter.msg, path.basename(message.counter.msg), function (err) {
                                if (err) {
                                    console.error(err);
                                    res.status(400).send(JSON.stringify(err));
                                    next();
                                }
                            });
                        } else {
                            res.status(200).send(message.counter.msg);

                        }
                    } else if (message.counter.status === 300) {
                        res.status(300).send(message.counter.msg);
                    } else if (message.counter.status === 404) {
                        res.status(404).send(message.counter.msg);
                    } else if (message.counter.status === 500) {
                        res.status(500).send(message.counter.msg);
                    }
                    else {
                        res.status(400).send({ "Error": message.counter.msg });
                    }

                    if (query_body.Forkapipath == "forkgethtml") {
                        res.on('finish', () => { process.kill() });
                    }
                } else {
                    res.status(400).send('Unable to process the request');
                }
            })
        } else {
            res.status(400).send('Invalid token');

        }
    })
}
exports.GetArticleTrack = (req, res) => {
    if (req.query.type == 'bks') {
        var f_for_bks_jnls = { 'stage': req.query.stage, 'bks_no': req.query.bks_no };
        var db_name = 'chapter';
        var File_Path = `${url_port_details.filePath}${url_port_details[req.query.type]}${f_for_bks_jnls.stage}/${f_for_bks_jnls.bks_no}`;

    } else {
        var f_for_bks_jnls = { 'jnls_no': req.query.jnls_no, 'art_no': req.query.art_no };
        var db_name = 'article';
        var File_Path = `${url_port_details.filePath}${url_port_details[req.query.type]}${f_for_bks_jnls.jnls_no}/${f_for_bks_jnls.art_no}`;
    }
    var sql_db = `${File_Path}/Query_ImageAnno.data`;
    var sqlite3 = require('sqlite3').verbose();
    if ((f_for_bks_jnls.stage !== undefined && f_for_bks_jnls.bks_no !== undefined) || (f_for_bks_jnls.jnls_no !== undefined && f_for_bks_jnls.art_no !== undefined)) {
        let db = new sqlite3.Database(sql_db);
        var sql = `${'SELECT * FROM '}${db_name}`;
        db.all(sql, (err, row) => {
            if (err) {
                res.status(400).send(err);

            }
            else {
                row.map(function (val, key) {
                    var Art_chap = `${val.idtype}`;
                    var chap_list_path = `${File_Path}/*(*${val.authorsequence}.html)`;
                    if (req.query.type == 'bks') {
                        if (val.idtype.includes("Chapter")) {
                            Art_chap = `${val.displaynum}_${val.idtype}`;
                        }
                        var chap_list_path = `${File_Path}/${Art_chap}/*(*${val.authorsequence}.html)`;
                    }
                    glob(chap_list_path, {}, (err, files) => {
                        if (files.length == 0) {
                            val['authsequence_html'] = false
                        } else {
                            val['authsequence_html'] = true
                        }

                        if (key + 1 == row.length) {
                            res.status(200).send(row);

                        }
                    })
                })

            }
        })
    } else {

        res.status(400).send('jnls_no | art_no is invalid');

    }

}

exports.PostUpload = (req, res) => {

    const formidable = require('formidable');

    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if (err) {
            response.status(400).send(err)
        } else {
            (async () => {
                let inter_query = { 'token': fields.token, 'method': fields.method, 'Forkapipath': fields.Forkapipath, 'i_fields': fields, 'i_files': files }
                await preProcessForEproof(req, res, inter_query);
            })();
        }
    })

}

exports.GetToken = (req, res) => {

    let jwtToken = require('../token.js');
    var flag = true;
    var missing_field = '';

    if (req.query.type) {
        if (req.query.type == 'bks') {
            var f_for_bks_jnls = ['bks_no', 'stage', 'mail_id'];

        } else {
            var f_for_bks_jnls = ['jnls_no', 'art_no', 'mail_id'];
        }

        for (let elem of f_for_bks_jnls) {
            if (req.query[elem] != undefined && req.query[elem] != '') {
                flag = true;
            } else {
                flag = false;
                missing_field = elem;
                break;
            }
        }
        if (flag) {
            res.status(200).send(jwtToken.getEncrypt(req.query));

        } else {
            res.status(400).send(missing_field + ' parameter is missing');
        }
    } else {
        res.status(400).send(' type paramter is missing');

    }

}
async function ReadPath(data_folder_path, res) {

    if (fs.existsSync(data_folder_path)) {
        fs.readFile(data_folder_path, function (err, data) {
            if (err) throw err // Fail if the file can't be read.
            else {
                res.writeHead(200, { 'Content-Type': 'image/jpeg' })
                res.end(data) // Send the file data to the browser.
            }
        })
    } else {
        res.end('Specific image is not found');
    }
}

exports.ServeImage = async (req, res) => {
    if(req.query.token != '' && req.query.token != undefined){
    const Token = {
        'method': 'get', 'tk': req.query
    }
    const input = preprocessor.preProcessSentToToken(Token);
    const dataFolderPath = await preprocessor.preProcessGetDataFolder(input);
    if (req.query.imgType == 'cover' && input.type == 'bks') {
        var data_folder_path = dataFolderPath.dataFolder_book + "Cover/" + dataFolderPath.jnls_bks_no + '_Cover.jpg';
    }
    else {
        var data_folder_path = `${dataFolderPath.dataFolderPath}${'images'}/${req.query.name}`;
    }
}else{
    var data_folder_path = `${url_port_details.imagePath}/${req.query.name}`;
}
    ReadPath(data_folder_path, res);

}

exports.PdfDownload = (req, res) => {
    if (fs.existsSync(req.query.pdfpath)) {
        res.download(req.query.pdfpath)
    } else {
        res.end('Specific pdf file is not found');

    }
}

var EproofingEngine = function (req, res) {
    (async () => {
        if (_.isEmpty(req.query)) {
            var intefaceinput = req.body;
        } else {
            var intefaceinput = req.query;

        }
        await preProcessForEproof(req, res, intefaceinput);
    })();
};

exports.GetHtml = EproofingEngine;
exports.AQ = EproofingEngine;
exports.PostImganno = EproofingEngine;
exports.GetImganno = EproofingEngine;
exports.GetCorrection = EproofingEngine;
exports.PostCorrection = EproofingEngine;
exports.SaveHtml = EproofingEngine;
exports.GetUpload = EproofingEngine;
exports.IndexTerm = EproofingEngine;
exports.Reference = EproofingEngine;
exports.IndexTermPages = EproofingEngine;
exports.Author = EproofingEngine;
exports.Affiliation = EproofingEngine;
exports.PostSubmitChapter = EproofingEngine;
exports.PostBookDetails = EproofingEngine;
exports.GetBookDetails = EproofingEngine;
exports.PostconvertPdf = EproofingEngine;
exports.Postbooksubmit = EproofingEngine;
exports.GetArticlePage = EproofingEngine;
exports.PostChapterPage = EproofingEngine;
exports.PostPackageGenerate = EproofingEngine;
exports.GetVendorOxeList = EproofingEngine;
exports.PostVendorOxeList = EproofingEngine;
exports.GetMath = EproofingEngine;



