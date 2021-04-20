
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

/*url_port_details.js file for port & other server endpoint details*/
let url_port_details = require('../url_port_details');
// let databaseurl = require(url_port_details.dbPath + 'db');
var _ = require('lodash');
let fs = require('fs');
var DOMParser = require('xmldom').DOMParser;
var parser = new DOMParser();
let jwtToken = require('../token.js');
var exe = require('child_process').exec;
let xpath = require('xpath'), dom = require('xmldom').DOMParser;
const preprocessor = require('../utils/processor');


async function pdfWrite(stateval) {
    return new Promise(function (resolve, reject) {
        var htmlfile = `${url_port_details.forkPath}indextermcontainerpdf.html`;

        fs.readFile(htmlfile, { encoding: 'utf-8' }, function (err, htlm_cnt) {
            if (err) {
                process.send({ counter: { status: 400, msg: err.toString() } });
                process.exit();

            } else {
                var doc_chap_Info_j_to_x = parser.parseFromString(stateval, 'text/xml');

                var xmlDoc = parser.parseFromString(htlm_cnt, 'text/xml');
                var doc = parser.parseFromString(htlm_cnt, 'text/xml');
                var getpdfclass_new = doc.getElementById('Index_panel');
                var getpdfclass_old = xmlDoc.getElementsByClassName('pdf');
                getpdfclass_old[0].appendChild(doc_chap_Info_j_to_x);
                xmlDoc.replaceChild(getpdfclass_old, getpdfclass_new);
                //  var tempath = 'D:/opt/ep_bks/pdf_temp/indextermcontainerpdf.html';
                var tempath = `${url_port_details.filePath}ep_bks/pdf_temp/indextermcontainerpdf.html`;
                let regexdoilt = new RegExp(`\&lt;`, 'g');
                xmlDoc = xmlDoc.toString().replace(regexdoilt, `<`);
                fs.writeFile(tempath, xmlDoc, function (err) {

                    process.send({
                        counter: {
                            status: 200, msg: {
                                'Status': 'success',
                                'Code': 200,
                                'htmlPath': tempath
                            }
                        }
                    });
                    process.exit();
                })

            }

        })
    })
}


async function IndexTermToGetToken(sql, db) {
    return new Promise(function (resolve, reject) {
        db.all(sql, (err, row) => {
            resolve(row);
        })
    })
}


async function ForkIndexTerm(payLoad) {
    try {
        const dataFolderPath = await preprocessor.preProcessGetDataFolder(payLoad);

        if (fs.existsSync(dataFolderPath.dataFolder_book)) {
            if (payLoad.stage == 300) {
                var dbtype = 'chapter';
            } else {
                var dbtype = 'bks';
                var chp_detls = "SELECT idtype,displaynum,token FROM chapter where authormailid='" + payLoad.mail_id + "' And idtype!='PartFrontmatter'";

            }
            const Generate_Token = { dbtype: dbtype, 'tk': { token: payLoad.token } };
            var db_On = preprocessor.preProcessSentToToken(Generate_Token);
            if (payLoad.pdf == 'true') {
                var query_sql = "SELECT * FROM indextable WHERE (status = 1 OR status = 2 OR status = 3) ORDER BY primaryterm COLLATE NOCASE ASC";
            } else {
                var query_sql = "SELECT * FROM indextable WHERE status != 3 ORDER BY primaryterm COLLATE NOCASE ASC";
            }
            db_On.all(query_sql, (err, data) => {

                (async () => {
                    if (payLoad.stage == 650) {
                        var book_chptr = await IndexTermToGetToken(chp_detls, db_On);

                    }
                    var stateval = '';
                    const db = data
                    if (err) {
                        process.send({ counter: { status: 400, msg: err.toString() } });
                        process.exit();
                    } else
                        if (db.length > 0) {
                            const uni = [...new Set(data.map(i => i.primaryterm))]
                            var index_terms = [];
                            uni.map(function (item) {
                                var arr = []
                                arr[item] = ''
                                return index_terms.push(arr);
                            })

                            index_terms.map(function (val1) {
                                var tmp_secnd_term = [];
                                var tmp_tertiary_term = [];
                                data.map(function (val) {
                                    if (Object.keys(val1)[0] === val.primaryterm) {
                                        if (val.secondaryterm) {
                                            if (!Object.keys(tmp_secnd_term).includes(val.secondaryterm)) {
                                                if (val.tertiaryterm && !(tmp_tertiary_term.includes(val.tertiaryterm))) {
                                                    tmp_tertiary_term.push(val.tertiaryterm)
                                                    tmp_secnd_term[val.secondaryterm] = [val.tertiaryterm];
                                                }
                                                else {
                                                    tmp_secnd_term[val.secondaryterm] = ''
                                                }
                                            }
                                            else {
                                                if (val.tertiaryterm && val.tertiaryterm != null && !(tmp_tertiary_term.includes(val.tertiaryterm))) {
                                                    tmp_tertiary_term.push(val.tertiaryterm)
                                                    var tum = [...tmp_secnd_term[val.secondaryterm]]
                                                    tmp_secnd_term[val.secondaryterm] = [...tum, val.tertiaryterm]
                                                }
                                            }

                                        }
                                    }
                                })
                                return index_terms[Object.keys(val1)[0]] = tmp_secnd_term;
                            })
                            index_terms.map(function (data) {
                                var chapterNO_see_and_seeAlso = prepareSeeSeeAlsoList(db, 'primaryterm', Object.keys(data)[0], 'iPage_seeterm', 'iPage_seeAlsoterm', []);
                                var index_item = '';
                                var index_item = `<div class="ipage_indexterm"><div class="ipage_primaryterm"><span>${Object.keys(data)[0]}</span>${chapterNO_see_and_seeAlso}</div>`;
                                var secc = [];
                                secc = index_terms[Object.keys(data)[0]]
                                var destinationObj = {};

                                Object.assign(destinationObj, secc);
                                destinationObj && Object.entries(destinationObj).map(function (data1) {
                                    chapterNO_see_and_seeAlso = prepareSeeSeeAlsoList(db, 'secondaryterm', data1[0], 'iPage_sec_seeterm', 'iPage_sec_seealsoterm', [Object.keys(data)[0]]);

                                    index_item += `<div class="iPage_secondaryterm"><span>${data1[0]}</span>${chapterNO_see_and_seeAlso}</div>`;
                                    data1[1] && data1[1].map((data2, k) => {
                                        chapterNO_see_and_seeAlso = prepareSeeSeeAlsoList(db, 'tertiaryterm', data2, 'iPage_ter_seeterm', 'iPage_ter_seealsoterm', [Object.keys(data)[0], data1[0]]);

                                        return index_item += `<div class="iPage_tertiaryterm"><span>${data2}</span>${chapterNO_see_and_seeAlso}</div>`;
                                    })
                                    return index_item;
                                })
                                index_item += "</div>";
                                return stateval = stateval + index_item;
                            })
                            function prepareSeeSeeAlsoList(datas, term, value, see, seealso, priSecTri) {

                                if (payLoad.stage == 650) {
                                    var Create_new_token = {};
                                    book_chptr.map(function (val, key) {
                                        if (val.displaynum != '') {
                                            Create_new_token[val.displaynum] = val.token
                                        }

                                    })
                                }

                                if (payLoad.pdf == 'true') {
                                    var chapter_id_class = { '1': 'chapter_id_inseted', '2': 'chapter_id_updated', '3': 'chapter_id_deleted' };
                                    var db_query;
                                    if (term === 'primaryterm') {
                                        db_query = datas.filter(function (val) {
                                            return val.primaryterm === value && val.secondaryterm === null && val.tertiaryterm === null
                                        });
                                    } else if (term === 'secondaryterm') {
                                        db_query = _.filter(datas, function (val, key) {
                                            return val.secondaryterm != null && val.secondaryterm === value && val.primaryterm === priSecTri[0] && val.tertiaryterm === null
                                        })

                                    } else if (term === 'tertiaryterm') {
                                        db_query = _.filter(datas, function (val, key) {
                                            return val.secondaryterm != null && val.tertiaryterm != null && val.primaryterm === priSecTri[0] && val.secondaryterm == priSecTri[1] && val.tertiaryterm === value
                                        })
                                    }
                                    var chaper_num_text = "";
                                    var see_text = "";
                                    var see_also_text = "";
                                    if (db_query && db_query.length) {
                                        db_query.map((row, i) => {
                                            if (payLoad.stage == 650) {
                                                chaper_num_text += `<a href="${url_port_details.Interfacelink_bks}${Create_new_token[row.chapterid]}/#IndexTerm${row.id}" class=${chapter_id_class[row.status]}>${'#'} ${row.chapterid}</a>` + '  ';
                                            } else {

                                                chaper_num_text += `<a href="${url_port_details.Interfacelink_bks}${payLoad.token}/#IndexTerm${row.id}" class=${chapter_id_class[row.status]}>${'#'} ${row.chapterid}</a>` + '  ';
                                            }
                                            //  var new_T_index_Term = { 'bks_no': payLoad.bks_no, 'chap_no': row.chapterid, 'stage': payLoad.stage, 'type': payLoad.type, 'mail_id': payLoad.mail_id };
                                            if (row.seeterm) {
                                                see_text += `<span class=${see}>${row.seeterm}</span>, `;
                                            }
                                            if (row.seealsoterm) {
                                                see_also_text += `<span class=${seealso}>${row.seealsoterm}</span>, `;
                                            }

                                        })
                                    }
                                    if (see_text != "") {
                                        see_text = `<span class=${see}><span>See</span>${see_text}</span>`;
                                    }
                                    if (see_also_text != "") {
                                        see_also_text = `<span class=${seealso}><span>SeeAlso</span>${see_also_text}</span>`;
                                    }
                                    var ret_val = '' + chaper_num_text + see_text + see_also_text;
                                    return ret_val;


                                } else {


                                    var db_query;
                                    if (term === 'primaryterm') {
                                        db_query = datas.filter(function (val) {
                                            return val.primaryterm === value && val.status != 3 && val.secondaryterm === null && val.tertiaryterm === null
                                        });
                                    } else if (term === 'secondaryterm') {
                                        db_query = _.filter(datas, function (val, key) {
                                            return val.secondaryterm === value && val.status != 3 && val.tertiaryterm === null
                                        })

                                    } else if (term === 'tertiaryterm') {
                                        db_query = _.filter(datas, function (val, key) {
                                            return val.status != 3 && val.tertiaryterm === value
                                        })
                                    }

                                    var chaper_num_text = "";
                                    var see_text = "";
                                    var see_also_text = "";
                                    if (db_query && db_query.length) {
                                        db_query.map((row, i) => {
                                            if (payLoad.stage == 650) {

                                                chaper_num_text += `<a href='#' class='navindex' token=${Create_new_token[row.chapterid]} id=${row.id}>${'#'} ${row.chapterid}</a>` + '  ';
                                            } else {
                                                chaper_num_text += `<a href='#' class='navindex' token=${payLoad.token} id=${row.id}>${'#'} ${row.chapterid}</a>` + '  ';
                                            }
                                            //chaper_num_text += `<a href='#' class='navindex' token=${payLoad.token} id=${row.id}>${'#'} ${row.chapterid}</a>` + '  ';
                                            if (row.seeterm) {
                                                see_text += `<span class=${see}>${row.seeterm}</span>, `;
                                            }
                                            if (row.seealsoterm) {
                                                see_also_text += `<span class=${seealso}>${row.seealsoterm}</span>, `;
                                            }

                                        })
                                    }
                                    if (see_text != "") {
                                        see_text = `<span class=${see}><span>See</span>${see_text}</span>`;
                                    }
                                    if (see_also_text != "") {
                                        see_also_text = `<span class=${seealso}><span>SeeAlso</span>${see_also_text}</span>`;
                                    }
                                    var ret_val = '' + chaper_num_text + see_text + see_also_text
                                    return ret_val
                                }
                            }
                            if (payLoad.pdf == 'true') {
                                db_On.close();
                                await pdfWrite(stateval);

                            }
                            else {
                                process.send({ counter: { status: 200, msg: stateval } });
                                db_On.close();

                            }
                        } else {
                            db_On.close();
                            if (payLoad.pdf == 'true') {
                                await pdfWrite('<div>No records found</div>');
                            }
                            else {
                                process.send({ counter: { status: 200, msg: '<div>No records found</div>' } });
                            }
                        }
                })();
            });
        } else {
            process.send({ counter: { status: 400, msg: 'File is not exits in this path ' + dataFolderPath.dataFolder_book } });
            process.exit();
        }
    }
    catch (error) {
        console.log(error)
        process.send({ counter: { status: 400, msg: error.toString() } });
        process.exit();
    }
}

// receive message from master process
process.on('message', async (message) => {
    await ForkIndexTerm(message);
});
