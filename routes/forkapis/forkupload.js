

/*START#############################################
#  $Revision: 1.0 $
#
#  Purpose  :Fork method for compliation.
#
#  Author   : Indhumathi R
#
#  Client   : Latex
#
#  Date     : Mar 10, 2020
#
######################################################################END*/

/*To get the value of other server url details*/
let url_port_details = require('../url_port_details');
const fs = require('fs');
let glob = require('glob');
const path = require('path');
/*token.js to get the decrypted data from the token */
let jwtToken = require('../token.js');
const preprocessor = require('../utils/processor');
var moment = require('moment');
var current_time = moment().format('YYYY-MM-DD, hh:mm:ss a');

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

async function Upload(inputs) {
    var author_details = [];
    /*To get the payload from the token*/
    var dataPath = await preprocessor.preProcessGetDataFolder(inputs);
    if (inputs.method == 'post') {
        var payLoad = jwtToken.getCyper(inputs.fields.token);
        var buttonType = inputs.fields.buttonType;
        var postType = inputs.fields.postType;

        if (postType == 'delete') {
            var dltname = inputs.fields.name;
        } else {
            /* Temporary location of our uploaded file */
            var temp_path = inputs.files.file.path;
            /* The file name of the uploaded file */
            var file_name = inputs.files.file.name;
        }
    } else if (inputs.method == 'get') {
        const Generate_Token = { dbtype: inputs.dbtype, 'tk': { token: inputs.token } };
        var db = preprocessor.preProcessSentToToken(Generate_Token);
        var find_db_name = 'article';
        var find_db_fieldname = 'submitstatus';
        if (inputs.dbtype == 'bks') {
            find_db_name = 'chapter';
            var find_db_fieldname = 'chapterstatus';
        }
    }
    /* Location where we want to copy the uploaded file */
    var imageUploadDir = dataPath.dataFolderPath + 'upload/'
    if (inputs.method == 'post') {
        const fs = require('fs-extra');
        const new_location = path.join(imageUploadDir);
        if (!fs.existsSync(new_location)) {
            fs.mkdirSync(new_location);
        }
        var esm_name = '_ESM.';
        if (inputs.type == 'bks') {
            esm_name = '_esm.';
        }

        if (postType == 'insert') {
            if (buttonType == 'article') {
                var renamefilename = new_location + file_name

            } else {
                var splitDot = file_name.split('.');
                var renamefilename = new_location + splitDot[0] + esm_name + splitDot[1];
            }
            if (!fs.existsSync(renamefilename)) {
                fs.copy(temp_path, renamefilename, function (err) {
                    if (err) {
                        process.send({ counter: { status: 400, msg: err } });
                        process.exit();
                    } else {
                        var s_c = `${inputs.clientIp} ${current_time} ${'Image upload is successfully created '} ${'FileName: '}${renamefilename}.`;

                        (async () => {
                            await preProcessCreateLogFile(s_c, dataPath);
                            process.send({ counter: { status: 200, msg: 'Image upload is successfully created' } });
                            process.exit();
                        })();
                    }
                });
            } else {
                process.send({ counter: { status: 200, msg: 'File is already existing' } });
                process.exit();

            }
        } else {
            (async () => {

                var uplaadDir = dataPath.dataFolderPath + 'upload/'
                var tableRenameDir = uplaadDir + dltname;
                if (fs.existsSync(tableRenameDir)) {
                    fs.unlinkSync(tableRenameDir);
                }
                var s_c = `${inputs.clientIp} ${current_time} ${'File removed successfully '} ${'FileName: '}${tableRenameDir}.`;
                await preProcessCreateLogFile(s_c, dataPath);
                process.send({ counter: { status: 200, msg: "File removed successfully" } });
                process.exit();
            })();

        }
    } else {
        await Get_Upload_sequence(0, dataPath, inputs, db, find_db_name, find_db_fieldname, author_details);
    }

}

async function Read_Image_db_data(vloop, db, sql, author_details, dataPath, find_db_fieldname) {
    return new Promise(function (resolve, reject) {
        let UpdNme = 'upload_';
        db.all(sql, (err, Rows) => {
            if (err) {
                reject(err)

            } else {
                if (Rows.length > 0) {
                    if (Rows[0][find_db_fieldname] == 0) {
                        var folder_Type = UpdNme + parseInt(vloop + 1);
                        var imageUploadDirs = dataPath.dataFolderPath + UpdNme + parseInt(vloop + 1) + '/';

                    } else {
                        var folder_Type = `${'upload'}`;
                        var imageUploadDirs = dataPath.dataFolderPath + 'upload/';

                    }
                    author_details.push(Rows[0])
                    Rows[0].folder = folder_Type;
                    if (fs.existsSync(imageUploadDirs)) {
                        fs.readdir(imageUploadDirs, (err, files) => {
                            if (err) {
                                process.send({ counter: { status: 400, msg: err } });
                                process.exit();
                            } else if (files.length == 0 || files == undefined) {
                                Rows[0].file = [];
                            } else {
                                Rows[0].file = files;
                            }
                            resolve(author_details)
                        })
                    } else {
                        Rows[0].file = [];
                        resolve(author_details)

                    }

                } else {
                    resolve(author_details)

                }

            }





        })
    })
}

async function Get_Upload_sequence(vloop, dataPath, inputs, db, find_db_name, find_db_fieldname, author_details) {
    return new Promise(function (resolve, reject) {

        (async () => {
            try {
                if (inputs.pdf == 'yes') {

                    var sql = `${"SELECT authorname, authormailid,authorsequence,"}${find_db_fieldname} FROM ${find_db_name} ${'where authorsequence = '}${parseInt(vloop + 1)} AND token='${inputs.token}'`;
                } else {
                    if (inputs.authorsequence == 1) {

                        var sql = `${"SELECT authorname, authormailid,authorsequence,"}${find_db_fieldname} FROM ${find_db_name} ${'where authorsequence = '}${parseInt(vloop + 1)} AND token='${inputs.token}'`;
                    } else {
                        var sql = `${"SELECT authorname, authormailid,authorsequence,"}${find_db_fieldname} FROM ${find_db_name} ${'where authorsequence = '}${parseInt(vloop + 1)}`;
                    }
                }

                var r_i_db_d = await Read_Image_db_data(vloop, db, sql, author_details, dataPath, find_db_fieldname);
                vloop++;
                if (vloop < inputs.authorsequence) {
                    await Get_Upload_sequence(vloop, dataPath, inputs, db, find_db_name, find_db_fieldname, author_details);

                }
                if (vloop == inputs.authorsequence) {
                    db.close();
                    var s_c = `${inputs.clientIp} ${current_time} ${'Get Multi authorsequence details from db '} ${find_db_name}.`;
                    await preProcessCreateLogFile(s_c, dataPath);
                    process.send({ counter: { status: 200, msg: author_details } });
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

// receive message from master process
process.on('message', async (message) => {

    const numberOfMailsSend = await Upload(message);

});