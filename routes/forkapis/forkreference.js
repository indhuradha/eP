

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
let url_port_details = require('../url_port_details');
var rp = require('request-promise');
/* npm xpath ,npm xmldom to load and traverse through the xml */
let xpath = require('xpath'), dom = require('xmldom').DOMParser;
var XMLSerializer = require('xmldom').XMLSerializer;

let xml2js = require('xml2js');
/*npm js2zmlparser to convert json to xml format */
let js2xmlparser = require("js2xmlparser");
/* Transfer the data  */
let http = require('http');
let httprequest = require('request');
var rp = require('request-promise');
let fun = require('../functions.js');
const utf8 = require('utf8');
const _ = require('lodash');
var staticBibType = ['bibarticle', 'bibbook', 'bibchapter'];
let fs = require('fs');
var moment = require('moment');
const preprocessor = require('../utils/processor');
var axios = require('axios');
var qs = require('qs');

var dynamicbibtype = "";

var oSerializer = new XMLSerializer();

var vfinalOpt = {

    'referenceDetails': '',
    'xmlDetails': '',
    "requestState": false
}


var authAndEditsubchild = ['initials', 'familyname', 'particle', 'suffix'];
var current_time = moment().format('YYYY-MM-DD, hh:mm:ss a');
var errorOutput =
{
    "bibarticle": [{ "bibauthorname": [{ "initials": [{ "#": "" }], "familyname": [{ "#": "" }] }, { "institutionalauthorname": [{ "#": "" }] }], "etal": [{ "#": "no" }], "year": [{ "#": "" }], "articletitle": [{ "#": "", "@": { "language": "En" } }], "journaltitle": [{ "#": "" }], "volumeid": [{ "#": "" }], "issueid": [{ "#": "" }], "firstpage": [{ "#": "" }], "lastpage": [{ "#": "" }], "bibarticledoi": [{ "#": "" }], "bibcomments": [{ "#": "" }] }],
    "bibbook": [{ "bibauthorname": [{ "initials": [{ "#": "" }], "familyname": [{ "#": "" }] }, { "institutionalauthorname": [{ "#": "" }] }], "etal": [{ "#": "no" }], "year": [{ "#": "" }], "booktitle": [{ "#": "" }], "EditionNumber": [{ "#": "" }], "editionnumber": [{ "#": "" }], "publishername": [{ "#": "" }], "publisherlocation": [{ "#": "" }], "firstpage": [{ "#": "" }], "lastpage": [{ "#": "" }], "bibbookdoi": [{ "#": "" }], "bibcomments": [{ "#": "" }] }],
    "bibchapter": [{ "bibauthorname": [{ "initials": [{ "#": "" }], "familyname": [{ "#": "" }] }, { "institutionalauthorname": [{ "#": "" }] }], "authoretal": [{ "#": "no" }], "year": [{ "#": "" }], "chaptertitle": [{ "#": "", "@": { "language": "En" } }], "bibeditorname": [{ "initials": [{ "#": "" }], "familyname": [{ "#": "" }], "particle": [{ "#": "" }], "suffix": [{ "#": "" }] }, { "bibinstitutionaleditorName": [{ "#": "" }] }], "editoretal": [{ "#": "" }], "eds": [{ "#": "" }], "booktitle": [{ "#": "" }], "EditionNumber": [{ "#": "" }], "publishername": [{ "#": "" }], "publisherlocation": [{ "#": "" }], "firstpage": [{ "#": "" }], "lastpage": [{ "#": "" }], "bibchapterdoi": [{ "#": "" }], "bibcomments": [{ "#": "" }] }]
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

async function Get_Crossref_Success_data(searchtype, xmlDoc, g_token, dataFolderPath, clientIp) {
    var journalKeys = ['person_name', 'year', 'title', 'full_title', 'volume', 'issue', 'first_page', 'last_page', 'doi'];
    var camelCaseChange = {
        'person_name': 'bibauthorname',
        'year': 'year',
        'title': 'articletitle',
        'full_title': 'journaltitle',
        'volume': 'volumeid',
        'issue': 'issueid',
        'first_page': 'firstpage',
        'last_page': 'lastpage',
        'doi': 'bibarticledoi'
    }
    let vyear = '//journal/journal_issue';
    if (searchtype == 'doi') {
        var doiyear = xpath.select(vyear + '/publication_date[@media_type="online"]/year|' + vyear + '/publication_date[@media_type="print"]/year', xmlDoc)
    } else {
        var doiyear = xpath.select(vyear + '/publication_date/year', xmlDoc)
    }
    var Jnls_title = xpath.select('//journal/journal_metadata/full_title', xmlDoc);
    var bibAuthorChild =
    {
        'person_name': xpath.select('//journal/journal_article/contributors/person_name', xmlDoc),
        'year': doiyear,
        'title': xpath.select('//journal/journal_article/titles/title', xmlDoc),
        'full_title': Jnls_title,
        'volume': xpath.select('//journal/journal_issue/journal_volume/volume', xmlDoc),
        'issue': xpath.select('//journal/journal_issue/issue', xmlDoc),
        'first_page': xpath.select('//journal/journal_article/pages/first_page', xmlDoc),
        'last_page': xpath.select('//journal/journal_article/pages/last_page', xmlDoc),
        'doi': xpath.select('//journal/journal_article/doi_data/doi', xmlDoc),
    }
    var bibStruct = xmlDoc.createElement("div");
    bibStruct.setAttribute("class", "BibStructured");
    var newBibType = xmlDoc.createElement('bibarticle');
    var unStruCnt = [];
    for (let x = 0; x < journalKeys.length; x++) {
        for (let y = 0; y < bibAuthorChild[journalKeys[x]].length; y++) {
            const { nodeName, textContent, childNodes } = bibAuthorChild[journalKeys[x]][y];
            if (nodeName !== '#text') {
                var newBibAuthor = xmlDoc.createElement(camelCaseChange[nodeName]);
                if(camelCaseChange[nodeName] == 'articletitle'){                    
                    newBibAuthor.setAttribute("Language", "--");
                }
                for (let h = 0; h < childNodes.length; h++) {
                    const { nodeName, textContent } = childNodes[h];
                    if (nodeName !== '#text' && 'affiliation' !== nodeName) {
                        if ('given_name' == nodeName) {
                            initialndfam = 'initials';
                            unStruCnt.push(textContent + '#')
                        }
                        else if ('surname' == nodeName) {
                            initialndfam = 'familyname';
                            unStruCnt.push(textContent + ' ')
                        }
                        var newInitialAndFam = xmlDoc.createElement(initialndfam);
                        var newInitialAndFamTxt = xmlDoc.createTextNode(textContent)
                        newInitialAndFam.appendChild(newInitialAndFamTxt);
                        newBibAuthor.appendChild(newInitialAndFam);
                    }
                }
                if (childNodes.length == 1) {
                    if (nodeName == 'first_page') {
                        unStruCnt.push(textContent + '-')
                    } else if (nodeName == 'issue' || nodeName == 'year') {
                        unStruCnt.push('(' + textContent + ') ')

                    } else if (nodeName == 'volume') {
                        unStruCnt.push(textContent)

                    } else if (nodeName == 'title') {
                        unStruCnt.push(textContent + '. ')

                    } else {
                        unStruCnt.push(textContent + ' ')

                    }
                    var newBibAuthortext = xmlDoc.createTextNode(textContent)
                    newBibAuthor.appendChild(newBibAuthortext);
                }
                newBibType.appendChild(newBibAuthor);
                bibStruct.appendChild(newBibType)
            }
        }
    }

    var strreplace = (unStruCnt.join()).replace(/,/g, "");
    var optUnStrCnt = '<div class="BibUnstructured">' + strreplace.replace(/#/g, ", ") + '</div>';
    var oSerializer = new XMLSerializer();
    var bibStrCnt = oSerializer.serializeToString(bibStruct);
    var finalOpt = {

        'referenceDetails': optUnStrCnt,
        'xmlDetails': bibStrCnt,
        "requestState": true
    }
    if (!_.isEmpty(doiyear) && !_.isEmpty(Jnls_title)) {

        if (searchtype == 'doi') {
            var s_c = `${clientIp} ${current_time}, ${'Reference using doi - '} ${'BibUnstructured:'} ${optUnStrCnt} ${'end of reference using doi'} .`;
            await preProcessCreateLogFile(s_c, dataFolderPath);
            process.send({ counter: { status: 200, msg: finalOpt } });
            process.exit();
        } else {
            var data = qs.stringify({
                'method': 'xmltojson',
                'content': bibStrCnt, 'token': g_token,
                'Forkapipath': 'forkreference'
            });
            var config = {
                method: 'post',
                url: `${url_port_details.refPDFRecal}/reference`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: data, rejectUnauthorized: false
            };

            axios(config)
                .then(function (response) {
                    process.send({ counter: { status: 200, msg: response.data } });
                    process.exit();
                })
                .catch(function (error) {
                    console.log(JSON.stringify(error));
                    process.send({ counter: { status: 400, msg: JSON.stringify(error) } });
                    process.exit();
                });
        }
    } else {
        process.send({
            counter: {
                status: 200, msg: {

                    'referenceDetails': optUnStrCnt,
                    'xmlDetails': '',
                    "requestState": true
                }
            }
        });
        process.exit();
    }
}


async function CreateCrossref(content, searchtype, type, reftext, g_token, dataFolderPath, clientIp) {


    var config = {
        method: 'post',
        url: 'http://doi.crossref.org/servlet/query?usr=springer&pwd=crpw464&format=unixref&qdata=' + encodeURIComponent(content),
    };
    axios(config)
        .then(function (response) {
            (async () => {

                if (response.data !== undefined) {
                    var DOMParser = require('xmldom').DOMParser;
                    var parser = new DOMParser();
                    var xmlDoc = parser.parseFromString(response.data, 'text/xml');
                    var AllCitation = xpath.select('//journal', xmlDoc);
                    if (AllCitation.toString() == '') {
                        if (searchtype == 'doi') {

                            var s_c = `${clientIp} ${current_time}, ${'Reference doi is failed'}.`;
                            await preProcessCreateLogFile(s_c, dataFolderPath);
                            process.send({ counter: { status: 200, msg: vfinalOpt } });
                            process.exit();
                        } else {
                            var s_c = `${clientIp} ${current_time}, ${'Reference text is failed'}.`;
                            await preProcessCreateLogFile(s_c, dataFolderPath);
                            process.send({ counter: { status: 300, msg: errorOutput } });
                            process.exit();
                        }
                    }
                    else {

                        await Get_Crossref_Success_data(searchtype, xmlDoc, g_token, dataFolderPath, clientIp);
                    }
                } else {
                    var s_c = `${clientIp} ${current_time}, ${'Reference text is failed'}.`;
                    await preProcessCreateLogFile(s_c, dataFolderPath);
                    process.send({ counter: { status: 300, msg: errorOutput } });
                    process.exit();

                }
            })();
        })
        .catch(function (error) {
            (async () => {
                var s_c = `${clientIp} ${current_time}, ${'Reference text is failed'}.`;
                await preProcessCreateLogFile(s_c, dataFolderPath);
                process.send({ counter: { status: 300, msg: errorOutput } });
                process.exit();
            })();
        });
}

async function Structure_XML(inputs, reftext, dataFolderPath, clientIp) {
    try {

        var DataBibType = '';
        xml = inputs;
        var parseString = xml2js.parseString;
        var DOMParser = require('xmldom').DOMParser;
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(xml, 'text/xml');

        for (var g = 0; g < xmlDoc.documentElement.childNodes.length; g++) {
            const { nodeName, childNodes } = xmlDoc.documentElement.childNodes[g];
            if ("#text" !== nodeName) {
                DataBibType = nodeName;
                for (var m = 0; m < childNodes.length; m++) {
                    const { nodeName, textContent } = childNodes[m];
                    /* To create Parent tag(bibauthor,bibeditor) for institutional tag */
                    if (childNodes[m].toString().includes("institutional")) {
                        if ('institutionalauthorname' === nodeName) {
                            var newInstitutional = xmlDoc.createElement('bibauthorname');
                        } else if ('bibinstitutionaleditorname' === nodeName) {
                            var newInstitutional = xmlDoc.createElement('bibeditorname');
                        }
                        var newInstitutionalchild = xmlDoc.createElement(nodeName);
                        var newInstitutionalchildtext = xmlDoc.createTextNode(textContent)
                        newInstitutionalchild.appendChild(newInstitutionalchildtext);
                        newInstitutional.appendChild(newInstitutionalchild);
                        xmlDoc.documentElement.childNodes[g].replaceChild(newInstitutional, childNodes[m]);
                    }
                    /* To change noinitials to initials */
                    else if (childNodes[m].toString().includes("noinitials")) {
                        for (let k = 0; k < childNodes[m].childNodes.length; k++) {
                            const { nodeName, textContent } = childNodes[m].childNodes[k];
                            if (nodeName !== "#text") {
                                if (nodeName === 'noinitials') {
                                    var newNoIntials = xmlDoc.createElement('initials');
                                } else {
                                    var newNoIntials = xmlDoc.createElement(nodeName);

                                }
                                var textNode = xmlDoc.createTextNode(textContent);
                                newNoIntials.appendChild(textNode);
                                childNodes[m].replaceChild(newNoIntials, childNodes[m].childNodes[k]);

                            }

                        }
                    }/* escape these (articletitle|journaltitle|chaptertitle|booktitle)  tag */
                    /* Tag name changes etal to authoretal or editoretal */
                    else
                        if ('etal' == nodeName) {


                            var authoEtaltag = xmlDoc.createElement('etal');

                            var authoEtalTextcontent = xmlDoc.createTextNode('yes');
                            authoEtaltag.appendChild(authoEtalTextcontent);
                            xmlDoc.documentElement.childNodes[g].replaceChild(authoEtaltag, childNodes[m]);
                        }
                        /* To change noinitials to initials */
                        /* escape these (articletitle|journaltitle|chaptertitle|booktitle)  tag */
                        else if (_.includes(nodeName, 'title') && (!_.includes(nodeName, 'no'))) {
                            content = (childNodes[m]).toString()
                            content = content.replace(/\<(articletitle|journaltitle|chaptertitle|booktitle|datasettitle)[^>]*\>/g, "");
                            content = content.replace(/\<\/(articletitle|journaltitle|chaptertitle|booktitle|datasettitle)\>/g, "");
                            var textNode = xmlDoc.createTextNode(content);
                            var newartciletitle = xmlDoc.createElement(nodeName);
                            newartciletitle.appendChild(textNode);
                            xmlDoc.replaceChild(newartciletitle, childNodes[m]);
                        }
                    /* escape these (articletitle|journaltitle|chaptertitle|booktitle)  tag */
                    /* Tag name changes etal to authoretal or editoretal */

                }

            }
        }
        var xmlToJsonOpt = oSerializer.serializeToString(xmlDoc);
        /* convert xml to json using JsonParser */
        parseString(xmlToJsonOpt, {
            attrkey: '@',
            explicitArray: true, pretty: false,
            explicitCharkey: true, trim: true, charkey: '#', emptyTag: { "#": '' },
        }, function (err, convertopt) {
            if (convertopt !== undefined) {
                if (convertopt.div !== undefined) {
                    if (DataBibType == 'bibdataset') {
                        if (convertopt['div'][DataBibType][0]['datasetsource']) {
                            convertopt['div'][DataBibType][0]['datasource'] = [{ '#': convertopt['div'][DataBibType][0]['datasetsource'][0]['#'] }];

                        }
                        var doi_other = convertopt['div'][DataBibType][0]['datasetid'][0]['@']['type'];
                        if (doi_other == 'DOI' || doi_other == 'Other' || doi_other == 'Accession') {
                            convertopt['div'][DataBibType][0]['datasetsource'] = [{ '#': doi_other }];
                        }
                        convertopt['div'][DataBibType][0]['url'] = [{ '#': convertopt['div'][DataBibType][0]['datasetid'][0]['@']['url'] }];

                        delete convertopt['div'][DataBibType][0]['datasetid'][0]['@'];
                    }
                    delete convertopt['div']['@'];
                }
                if (err) {
                    process.send({ counter: { status: 404, msg: JSON.stringify(err) } });
                }
                process.send({ counter: { status: 200, msg: convertopt['div'] } });

            } else {
                process.send({ counter: { status: 400, msg: 'Cannot convert xml to json ' } });

            }

        })

        ///////////convert json end////////////////////////////
    }
    catch (err) {
        console.log(err.toString())
        process.send({ counter: { status: 200, msg: err.toString() } });
    }
}
async function ForkReference(input) {
    const dataFolderPath = await preprocessor.preProcessGetDataFolder(input);
    var searchtype = input.searchtype;
    var reftext = input.reftext;
    var inputs = input.content;
    var method = input.method;
    var type = input.type;
    var g_token = input.token;
    var clientIp = input.clientIp;
    var content = '';

    if (searchtype == 'doi') {
        content += '<?xml version = "1.0" encoding="UTF-8"?>'
        content += '<query_batch xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.0" '
        content += 'xmlns="http://www.crossref.org/qschema/2.0" xsi:schemaLocati'
        content += 'on="http://www.crossref.org/qschema/2.0 http://www.crossref.org/qschema/crossref_query_input2.0.xsd">'
        content += '<head><email_address>jgayathri@sps.co.in</email_address><doi_batch_id>25423871</doi_batch_id></head><body>'
        content += '<query key="mykey" expanded-results="true"><doi>' + reftext + '</doi></query></body></query_batch>'
        await CreateCrossref(content, searchtype, type, reftext, g_token, dataFolderPath, clientIp)

    } else {



        const options = {
            useSelfClosingTagIfEmpty: false,
            format: { doubleQuotes: true, pretty: false },
            declaration: { include: false }
        }

        if (method == 'xmltojson') {

            await Structure_XML(inputs, reftext, dataFolderPath, clientIp);
        } else if (method == 'jsontoxml') {

            var changeElement = ['noinitials', 'etal', 'eds', 'noarticletitle', 'nochaptertitle'];
            var bibTypeChildStaticArray = [{
                'bibarticle': ["bibauthorname", "etal", "year", "articletitle", "noarticletitle", "journaltitle", "volumeid", "issueid", "firstpage", "lastpage", 'bibarticlenumber', "bibarticledoi", "occurrence", "bibcomments"],
                'bibchapter': ['bibauthorname', 'authoretal', 'year', 'chaptertitle', 'nochaptertitle', 'bibeditorname', 'seriestitle', 'numberinseries', 'eds', 'editoretal', 'booktitle', 'editionnumber', 'confeventname', 'confseriesname', 'confeventabbreviation', 'confnumber', 'confeventlocation', 'confEventdate', 'confeventdatestart', 'confeventdateend', 'confeventurl', 'publishername', 'publisherlocation', 'firstpage', 'lastpage', 'bibchapterdoi', 'bibbookdoi', 'occurrence', 'ISBN', 'bibcomments'],
                'bibbook': ['bibauthorname', 'bibeditorname', 'etal', 'year', 'booktitle', 'editionnumber', 'confeventname', 'confferiesname', 'confeventabbreviation', 'confnumber', 'confeventlocation', 'confeventdat', 'confeventdatestart', 'confeventdateend', 'confeventurl', 'seriestitle', 'numberinseries', 'publishername', 'publisherlocation', 'firstpage', 'lastpage', 'bibbookdoi', 'occurrence', 'ISBN', 'bibcomments']
            }]
            var nobibtypeelement = [{
                'bibarticle': ['articletitle'],
                'bibchapter': ['chaptertitle']
            }]
            var g_log = `${'Text - '}`;

            await Structure_DataSet_json(method, inputs, bibTypeChildStaticArray, changeElement, nobibtypeelement, options, reftext, dataFolderPath, clientIp, g_log);
        } else if (method == 'bibunstructured') {
            try {
                content += '<?xml version = "1.0" encoding="UTF-8"?><query_batch xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.0" xmlns="http://www.crossref.org/qschema/2.0" xsi:schemaLocation="http://www.crossref.org/qschema/2.0 http://www.crossref.org/qschema/crossref_query_input2.0.xsd"><head><email_address>your@email.org</email_address><doi_batch_id>01032012</doi_batch_id></head><body><query key="q1" enable-multiple-hits="true"><unstructured_citation>' + reftext + '</unstructured_citation></query></body></query_batch>'
                await CreateCrossref(content, searchtype, type, reftext, g_token, dataFolderPath, clientIp)
            }
            catch (error) {

                process.send({ counter: { status: 404, msg: "error" } });
            }
        } else if (method == 'bibDataset_json') {
            var bibTypeChildStaticArray = [{
                'bibdataset': ["bibauthorname", "etal", "year", "datasettitle", "datasource", "nodatasource", "datasetsource", "url", "version", "datasetid"]
            }]

            var changeElement = ['noinitials', 'etal', 'eds', 'nodatasettitle', 'nodatasource', 'url', 'version'];

            var nobibtypeelement = [{
                'bibdataset': ['datasettitle']
            }]
            var g_log = `${'bibDataset - '}`;

            await Structure_DataSet_json(method, inputs, bibTypeChildStaticArray, changeElement, nobibtypeelement, options, reftext, dataFolderPath, clientIp, g_log);


        } else {
            process.send({ counter: { status: 400, msg: JSON.stringify({ 'ErrorCode': 'Unsupported request argument' }) } });
            process.exit();
        }
    }
}
async function Structure_DataSet_json(method, inputs, bibTypeChildStaticArray, changeElement, nobibtypeelement, options, reftext, dataFolderPath, clientIp, g_log) {
    try {
        (async () => {
            var stringToJson = JSON.parse(inputs);
            /* Get bibtype keys  */
            var parentBibType = Object.keys(stringToJson);
            /* Get bibtype  */
            const dynamicbibtype = parentBibType[parentBibType.length - 1];
            for (let h = 0; h < nobibtypeelement.length; h++) {
                if (_.get(nobibtypeelement[h][dynamicbibtype], 'length', false)) {
                    for (let n = 0; n < nobibtypeelement[h][dynamicbibtype].length; n++) {
                        var checkwithoutkey = nobibtypeelement[h][dynamicbibtype][n];
                        if (stringToJson[dynamicbibtype][0][checkwithoutkey] === undefined) {
                            stringToJson[dynamicbibtype][0]['no' + checkwithoutkey] = [{ '#': '' }]
                        }
                    }
                }

            }
            if (method == 'bibDataset_json') {
                var val_doi = stringToJson[dynamicbibtype][0]['datasetsource'][0]['#'];
                if (val_doi == 'DOI') {
                    stringToJson[dynamicbibtype][0]['datasetid'][0] = [{ "@": { 'type': val_doi }, '#': stringToJson[dynamicbibtype][0]['datasetid'][0]['#'] }]
                } else {
                    var val_url = stringToJson[dynamicbibtype][0]['url'][0]['#'];
                    stringToJson[dynamicbibtype][0]['datasetid'][0] = [{ "@": { 'type': val_doi, 'url': val_url }, '#': stringToJson[dynamicbibtype][0]['datasetid'][0]['#'] }]
                    delete stringToJson[dynamicbibtype][0]['url'];
                }
                if (stringToJson[dynamicbibtype][0]['datasource']) {
                    stringToJson[dynamicbibtype][0]['datasetsource'][0] = stringToJson[dynamicbibtype][0]['datasource'][0]['#'];
                    delete stringToJson[dynamicbibtype][0]['datasource'];

                } else {
                    delete stringToJson[dynamicbibtype][0]['datasetsource'];

                }

            }


            var jsontoxml = js2xmlparser.parse(dynamicbibtype, stringToJson[dynamicbibtype][0], options);
            var doc = new dom().parseFromString(jsontoxml);
            var newCitation = doc.createElement(dynamicbibtype);
            /* Sorting BibType's Child & Subchilds */
            var unStruCnt = [];
            var bibStruct = doc.createElement("div");
            bibStruct.setAttribute("class", "BibStructured");
            var unbibStruct = doc.createElement("div");
            unbibStruct.setAttribute("class", "BibUnstructured");

            var order_cnt = { 'datasettitle': '', 'datasetsource': '', 'version': '', 'datasetid': '', 'year': '' }
            for (x = 0; x < bibTypeChildStaticArray.length; x++) {
                var Ins_opt_i_f_s_p = ''; var e_t_a_l = '';
                for (let z = 0; z < bibTypeChildStaticArray[x][dynamicbibtype].length; z++) {
                    var nodes = xpath.select("/" + dynamicbibtype + "/" + bibTypeChildStaticArray[x][dynamicbibtype][z], doc);
                    var ins_loop = 0;

                    for (i = 0; i < nodes.length; i++) {
                        if (nodes[i].toString().includes("institutional")) {
                            ins_loop++;
                            if (nodes.length > 1 && nodes.length == ins_loop) {
                                Ins_opt_i_f_s_p += `${'& '}${nodes[i].textContent}${'. '}`;
                            } else if (nodes.length <= 2 || i + 1 == nodes.length - 1) {
                                Ins_opt_i_f_s_p += `${nodes[i].textContent}${'. '}`;

                            }
                            else {
                                Ins_opt_i_f_s_p += `${nodes[i].textContent}${'., '}`;

                            }

                            newCitation.appendChild(nodes[i].firstChild);
                        } else if (nodes[i].toString().includes("familyname")) {
                            var bib_i_f_s_p = { 'familyname': '', 'initials': '' }
                            var keys = i + 1;
                            ins_loop++;
                            var NewBibSubChild = doc.createElement(nodes[i].nodeName)
                            for (let g = 0; g < authAndEditsubchild.length; g++) {
                                var subNodes = xpath.select("//" + dynamicbibtype + "/" + nodes[i].nodeName + "[" + keys + "]/" + authAndEditsubchild[g], doc);
                                for (let h = 0; h < subNodes.length; h++) {
                                    if (subNodes[h].textContent === '') {
                                        var noinitialsnode = doc.createElement('no' + subNodes[h].nodeName);
                                        NewBibSubChild.appendChild(noinitialsnode)
                                    } else {
                                        NewBibSubChild.appendChild(subNodes[h])
                                        if (subNodes[h].nodeName == 'initials') {

                                            var newString = subNodes[h].textContent.replace(/([A-Z\u00C0-\u00DC]([a-z\u00E0-\u00FC]+)?(\s?[A-Z\u00C0-\u00DC]([a-z\u00E0-\u00FC]+))?)/g, "$1");
                                            if (nodes.length <= 2 || nodes.length == ins_loop || keys == nodes.length - 1) {
                                                bib_i_f_s_p[subNodes[h].nodeName] = `${newString}${'. '}`;
                                            }
                                            else {
                                                bib_i_f_s_p[subNodes[h].nodeName] = `${newString}${'., '}`;

                                            }
                                        } else {
                                            if (nodes.length > 1 && ins_loop == nodes.length) {
                                                bib_i_f_s_p[subNodes[h].nodeName] = `${'& '}${subNodes[h].textContent}${','}`;
                                            } else {
                                                bib_i_f_s_p[subNodes[h].nodeName] = `${subNodes[h].textContent}${','}`;
                                            }
                                        }
                                    }
                                }
                            }
                            unStruCnt.push(bib_i_f_s_p)
                            newCitation.appendChild(NewBibSubChild);
                        }
                        else {
                            if (nodes[i].nodeName == 'etal') {

                                if (nodes[i].textContent == 'yes') {
                                    var etalNode = doc.createElement('etal');
                                    var etalText = doc.createTextNode(' ');
                                    etalNode.appendChild(etalText)
                                    newCitation.appendChild(etalNode);
                                }
                                e_t_a_l += `${'<i>et al</i>'}${'. '}`

                            }
                            // else if (nodes[i].nodeName == 'eds') {
                            //         var edsNode = doc.createElement('eds');
                            //         var edsText = doc.createTextNode(' ');
                            //         edsNode.appendChild(edsText)
                            //         newCitation.appendChild(edsNode);
                            // }

                            else {
                                newCitation.appendChild(nodes[i]);
                                if (method == 'bibDataset_json') {
                                    var ExternalRef = doc.createElement("span");
                                    ExternalRef.setAttribute("class", 'ExternalRef');
                                    var RefSource = doc.createElement("span");
                                    RefSource.setAttribute("class", 'RefSource');
                                    var RefTarget = doc.createElement("RefTarget");
                                    if ('datasetsource' == nodes[i].nodeName) {
                                        order_cnt[nodes[i].nodeName] = '<i>' + nodes[i].textContent + '</i>,';
                                    }
                                    else if ('datasetid' == nodes[i].nodeName && val_doi == 'DOI') {
                                        var RefSource_url = doc.createTextNode('https://doi.org/' + nodes[i].textContent);
                                        RefSource.appendChild(RefSource_url);
                                        RefTarget.setAttribute("Address", nodes[i].textContent);
                                        RefTarget.setAttribute("TargetType", val_doi);
                                        ExternalRef.appendChild(RefSource);
                                        ExternalRef.appendChild(RefTarget);
                                        order_cnt[nodes[i].nodeName] = ExternalRef.toString();

                                    }
                                    else if ('datasetid' == nodes[i].nodeName && (val_doi == 'Accession' || val_doi == 'Other')) {
                                        var RefSource_url = doc.createTextNode(nodes[i].textContent);
                                        RefSource.appendChild(RefSource_url);
                                        RefTarget.setAttribute("Address", val_url);
                                        RefTarget.setAttribute("TargetType", 'url');
                                        ExternalRef.appendChild(RefSource);
                                        ExternalRef.appendChild(RefTarget);
                                        order_cnt[nodes[i].nodeName] = ExternalRef.toString();

                                    }
                                    else {
                                        if (nodes[i].nodeName == 'year') {
                                            order_cnt[nodes[i].nodeName] = `${'('}${nodes[i].textContent}${').'}`;
                                        }
                                        else {
                                            order_cnt[nodes[i].nodeName] = `${nodes[i].textContent}${','}`;

                                        }

                                    }
                                } else {

                                    newCitation.appendChild(nodes[i]);
                                }
                            }
                        }
                    }
                }
            }

            var newCitation = oSerializer.serializeToString(newCitation);
            var doc = new dom().parseFromString(newCitation.toString());
            if (method == 'bibDataset_json') {

                var un_opt_i_f_s_p = '';
                unStruCnt.map(function (key1, val1) {
                    un_opt_i_f_s_p += `${Object.values(key1).join(' ')}${' '}`;
                    return un_opt_i_f_s_p;

                })
                /* Sorting BibType's Child & Subchilds */


                var Spandoi = doc.createTextNode(`${un_opt_i_f_s_p}${Ins_opt_i_f_s_p}${e_t_a_l}${Object.values(order_cnt).join(' ')}`);

            } else {
                var Spandoi = doc.createTextNode(reftext);

            }
            bibStruct.appendChild(doc);
            unbibStruct.appendChild(Spandoi)
            const regexopenand = new RegExp(`\&amp;`, 'g');
            bibUnStrCnt = unbibStruct.toString().replace(regexopenand, `&`);
            const regexopen = new RegExp(`\&lt;`, 'g');
            bibUnStrCnt = bibUnStrCnt.toString().replace(regexopen, `<`);


            var citecsloptdom = new dom().parseFromString(bibStruct.toString());

            /* Sorting bibtype's subchilds */
            for (x = 0; x < changeElement.length; x++) {
                var nodes = xpath.select("//" + changeElement[x], citecsloptdom);
                for (i = 0; i < nodes.length; i++) {
                    var textElement = citecsloptdom.createTextNode(" ");
                    nodes[i].appendChild(textElement);
                }

            }
            var s_c = `${clientIp} ${current_time}, ${'Reference using'} ${g_log} ${'BibUnstructured: '}${bibUnStrCnt} ${'end of Reference using'} ${g_log}.`;
            await preProcessCreateLogFile(s_c, dataFolderPath);
            process.send({ counter: { status: 200, msg: citecsloptdom.toString() + bibUnStrCnt } });
            process.exit();
            /* Rename lowercase to camelcase */
        })();

    }
    catch (error) {
        console.error("problem with request: " + error);
        process.send({ counter: { status: 404, msg: "error" } });
    }

}


// receive message from master process
process.on('message', async (message) => {
    await ForkReference(message);
});


