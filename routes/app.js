

/*npm express framework*/
var express = require('express');
var app = express();
/*npm bodyparser to accept the json response */
let bodyParser = require('body-parser');
const morgan = require('morgan')
/*config.json file for port & other server endpoint details*/
let url_port_details = require('./url_port_details.js');


let getTokenDetails = require("./getTokenDetails");
let common_eproof = require("./apis/common_eproof.js");


app.use(bodyParser.urlencoded({ extended: true, limit: '500mb' }));// support encoded bodies
app.use(bodyParser.json({ limit: '500mb', extended: true }));// support json encoded bodies

app.use(morgan('dev'))
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(function (err, req, res, next) {
  res.status(500).send('Something broke!')
});

app.use(bodyParser.json());

app.all('/', (req, res) => res.send('Welcom to the E-Proofing services. No exact details are provided'));
var useragent = require('express-useragent');
app.use(useragent.express());


/*Endpoint URL for all the routes*/

app.get('/eP-api/gethtml', common_eproof.GetHtml);
app.get('/eP-api/gettoken', common_eproof.GetToken);
app.get('/eP-api/gettokendetails', getTokenDetails.GetTokenDetails);
app.post('/eP-api/savehtml', common_eproof.SaveHtml);
app.get('/eP-api/getmath', common_eproof.GetMath);
app.get('/eP-api/correction', common_eproof.GetCorrection);
app.post('/eP-api/aq', common_eproof.AQ);
app.post('/eP-api/correction', common_eproof.PostCorrection);
app.post('/eP-api/upload', common_eproof.PostUpload);
app.get('/eP-api/upload', common_eproof.GetUpload);
app.post('/eP-api/indexterm', common_eproof.IndexTerm);
app.post('/eP-api/reference', common_eproof.Reference);
app.get('/eP-api/serveImage', common_eproof.ServeImage);
app.post('/eP-api/indextermpages', common_eproof.IndexTermPages);
app.post('/eP-api/author', common_eproof.Author);
app.get('/eP-api/imganno', common_eproof.GetImganno);
app.post('/eP-api/imganno', common_eproof.PostImganno);
app.post('/eP-api/affiliation', common_eproof.Affiliation);
app.post('/eP-api/submitchapter', common_eproof.PostSubmitChapter);
app.get('/eP-api/bookdetails', common_eproof.GetBookDetails);
app.post('/eP-api/bookdetails', common_eproof.PostBookDetails);
app.post('/eP-api/converthtmltopdf', common_eproof.PostconvertPdf);
app.get('/eP-api/articleTrack', common_eproof.GetArticleTrack);
app.post('/eP-api/booksubmit', common_eproof.Postbooksubmit);
app.get('/eP-api/pdfdownload', common_eproof.PdfDownload);
app.post('/eP-api/chapterpage', common_eproof.PostChapterPage);
app.get('/eP-api/articlepage', common_eproof.GetArticlePage);
app.get('/eP-api/vendoroxelist', common_eproof.GetVendorOxeList);
app.post('/eP-api/vendoroxelist', common_eproof.PostVendorOxeList);
app.post('/eP-api/packagegenerate', common_eproof.PostPackageGenerate);


module.exports = app


