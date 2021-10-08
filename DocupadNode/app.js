const express = require('express');
const carbone = require('carbone');
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const axios = require('axios');
const https = require('https');
const HummusRecipe = require('hummus-recipe');
const jsforce= require('jsforce')
require('dotenv').config();
const app = express();
app.use(cors());
// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
// parse application/json
app.use(express.json());
app.use(express.static(path.join(__dirname, "templates")));
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PATCH, DELETE, OPTIONS"
    );
    next();
});

//Multer storage
//multer
const storage = multer.diskStorage({


    destination: function (req, file, cb) {

        var dir = req.dir || "./templates";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});
const upload = multer({ storage: storage });

app.post("/template", upload.single("template"), async (req, res, next) => {
    try {
        if(!req.headers.serverurl){
            return res.json({message:"pass the serverUrl in the header"})
        }
        else if(!req.headers.sessionid){
            return res.json({message:"pass the sessionId in the header"})
        }
        const jsforceConnection = new jsforce.Connection({
            serverUrl :req.headers.serverurl ,
            sessionId :req.headers.sessionid
        })
        jsforceConnection.identity(async(err,info)=>{
            console.log(req.headers)
            if(err){
                console.log("error is",err)
                return res.json(err)
            }
            console.log("connected")
            const options = {
                convertTo: "pdf",
                extension: "docx"
            }
            const file = req.file;
    
            if (!file) {
                return res.json({
                    error: "upload the file",
                });
            }
            var fileName = file.originalname
            console.log(fileName)
            await jsforceConnection.sobject('Template__c').find({ Name: fileName }).execute(async (err, records) => {
                if (err) {
                    console.log(err)
                }
                if (records.length == 0) {
                    const fileName = file.originalname
                    const lastIndex = fileName.lastIndexOf(".");
                    const Stringlength = fileName.length;
                    const output = fileName.substr(0, lastIndex) + fileName.substr(Stringlength);
                    //convert to pdf
                    await fs.readFile(`./templates/${file.originalname}`, async (err, result) => {
                        if (err) { console.log(err) }
                        await carbone.convert(result, options, async (err, fileData) => {
                            if (err) { console.log(err) }
                            fs.writeFileSync(`./templates/${output}.pdf`, fileData)
                            // file details
                            var fileOnServer = `./templates/${file.originalname}`
                            var uploadFileName = `${file.originalname}`
                            await fs.readFile(fileOnServer, function (err, fileData) {
                                if (err) { console.log(err) }
                                var base64data = new Buffer.from(fileData).toString('base64');
                                jsforceConnection.sobject('ContentVersion').create({
                                    'Title': output,
                                    'PathOnClient': uploadFileName,
                                    'VersionData': base64data,
                                    // 'IsMajorVersion': false
                                },
                                    //query contentversion get the contentdoucumentid get(069)
                                    async (err, uploadedAttachment) => {
    
                                        if (err) {
                                            console.log(err)
                                            return res.json({ error: err })
                                        }
                                        // await addFileMetaData(uploadedAttachment.id, file.originalname,);
                                        const contentVersion = await jsforceConnection.sobject("ContentVersion").retrieve(uploadedAttachment.id)
    
                                        jsforceConnection.sobject('Template__c').create({
                                            Name: contentVersion.PathOnClient,
                                            templateId__c: contentVersion.ContentDocumentId,
                                            LatestVersionId__c: contentVersion.Id
                                        }, function (err, result) {
                                            if (err) { console.log(err) }
                                            jsforceConnection.sobject('ContentDocumentLink').create({
                                                LinkedEntityId: result.id, // Template__c record id
                                                contentdocumentid: contentVersion.ContentDocumentId,
                                                ShareType: 'V'  // constant
                                            },
                                                function (err, contnentDocumentLink) {
                                                    if (err) { next(err) }
                                                    return res.json({
                                                        success: true,
                                                        originalFileName: `https://${req.headers.host}/${file.originalname}`,
                                                        outputFileName: `https://${req.headers.host}/${output}.pdf`,
                                                        templateId: contentVersion.ContentDocumentId// (content document id 069)
    
                                                        // templateId:uploadedAttachment.id //(content version id)
                                                    })
                                                })
    
                                        })
    
                                    }
                                )
                            })
                        })
                    })
                }
                else {
                    return res.json({
                        error: "Existing templateName already there choose the other name"
                    })
                }
            })
           
        })
      


    } catch (err) {
        return next(err)
    }
});
app.post('/generateDocumentPreview', async (req, res, next) => {


    // start of the delete all temp file
    const file_array = []
    const directory = "templates";
    await fs.readdir(directory, async (err, files) => {
        for (const file of files) {
            if (file != '11.PNG') {
                file_array.push({
                    file_name: file
                })
            }
        }
        const dir = "templates/output"
        await fs.readdir(dir, async(err, files) => {
            for (const file of files) {
                if (file != '11.PNG') {
                    file_array.push({
                        file_name: file
                    })
                }
            }
            const dir = "templates/passwordProtectedFile"
            await fs.readdir(dir, (err, files) => {
                for (const file of files) {
                    if (file != '11.PNG') {
                        file_array.push({
                            file_name: file
                        })
                    }
                }
                console.log(file_array)
                file_array.forEach(x => {
                    // fs.unlinkSync(`./templates/${x.file_name}`)
                    // fs.unlinkSync(`./templates/output/${x.file_name}`)
                    // fs.unlinkSync(`./templates/passwordProtectedFile/${x.file_name}`)
                    fs.unlink(`./templates/${x.file_name}`, (resp) => {
                        fs.unlink(`./templates/output/${x.file_name}`,(result)=>{
                            fs.unlink(`./templates/passwordProtectedFile/${x.file_name}`,(res)=>{
                                console.log("deleted")
                            })
                        })
                       
                    })
                })
            }
            )
        })

    })
    // End of the delete all temp file

    try {
        if(!req.headers.serverurl){
            return res.json({message:"pass the serverUrl in the header"})
        }
        else if(!req.headers.sessionid){
            return res.json({message:"pass the sessionId in the header"})
        }
        const jsforceConnection = new jsforce.Connection({
            serverUrl :req.headers.serverurl ,
            sessionId :req.headers.sessionid
        })
        
        jsforceConnection.identity(async(err,info)=>{
            if(err){
                return res.json(err)
            }
            const payload = {
                ...req.body,
            }
            let options = {};
            if (!payload.options) {
                options = { convertTo: "pdf" }
            }
            else if (typeof (payload.options.convertTo) == 'string') { options = { convertTo: payload.options.convertTo } }
            else if (typeof (payload.options.convertTo) == 'object') {
                options = {
                    convertTo: {
                        formatName: 'pdf',
                        formatOptions: {
                            EncryptFile: true,
                            DocumentOpenPassword: payload.options.convertTo.formatOptions.DocumentOpenPassword,
                            Watermark: payload.options.convertTo.formatOptions.Watermark
                        }
                    }
                }
            }
            else { options = { convertTo: "pdf" } }
            options.extension = "docx"
            let templateId
            if (payload.templateName) {
                await jsforceConnection.sobject('Template__c').find({ Name: payload.templateName }).execute((err, ret) => {
                    if (err) {
                        return console.log(err)
                    }
                    templateId = ret[0].templateId__c
                })
            }
            else {
                templateId = payload.templateId
            }
    
            const result = await jsforceConnection.query("SELECT Id, ContentDocumentId, Title, VersionData,PathOnClient, FileType,FileExtension,VersionNumber, ContentBodyId, IsLatest, ContentUrl FROM ContentVersion where IsLatest = true and ContentDocumentId ='" + templateId + "'")
    
            if (result.totalSize === 0) {
                return res.json({
                    error: "Invalid Template id"
                })
            }
            const fileName = result.records[0].Title
            const fileData = await jsforceConnection.sobject('ContentVersion').record(templateId).blob('Body');
            const host = fileData.headers.host
            const path = result.records[0].VersionData
            const token = fileData.headers.Authorization
            var fileExt = result.records[0].FileExtension
            const option = {
                hostname: host,
                port: 443,
                path: path,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Authorization': token
                }
            }
    
            const getFileRequest = new Promise((resolve, reject) => {
                var request = https.request(option, function (response) {
                    var chunks = [];
                    response.on("data", function (chunk) {
                        chunks.push(chunk);
                        console.log('chunk')
                    });
                    response.on("end", async function (chunk) {
                        var body = Buffer.concat(chunks);
                        fs.writeFile(`templates/${fileName}.${fileExt}`, body, (err, result) => {
                            if (err) {
                                reject(err)
                                console.log(err)
                            }
                            resolve(result)
                        });
                    });
                    response.on("error", function (error) {
                        return res.json({
                            success: false,
                            error: error
                        })
                    });
                })
                request.end();
    
            })
    
            getFileRequest.then(async x => {
                await carbone.render(`./templates/${fileName}.${fileExt}`, payload.data, async function (err, resp) {
                    if (err) {
                        console.log(err);
                        return
                    }
                    var randomNumber = Math.floor(100000 + Math.random() * 900000);
    
                    // write the result
                    fs.writeFileSync(`templates/output/${fileName}_${randomNumber}.${fileExt}`, resp)
                    await fs.readFile(`templates/output/${fileName}_${randomNumber}.${fileExt}`, async (err, result) => {
                        if (err) { console.log(err) }
                        await carbone.convert(result, options, async (err, fileData) => {
                            if (err) { console.log(err) }
                            fs.writeFileSync(`templates/passwordProtectedFile/${fileName}_${randomNumber}.pdf`, fileData);
                              //start of the watermark
                              const src = `templates/passwordProtectedFile/${fileName}_${randomNumber}.pdf`;
                              const outputfilename = `templates/output/${fileName}_${randomNumber}.pdf`;
                              const pdfDoc = new HummusRecipe(src, outputfilename);
                              pdfDoc
                              .encrypt({
                                  userPassword: payload.DocumentOpenPassword,
                                  // ownerPassword: '123',
                                  userProtectionFlag: 4
                              })
                          const pages = pdfDoc.metadata.pages;
                          for (let i = 1; i <= pages; i++) {
                              pdfDoc
                                  .editPage(i)
                                  .text(payload.Watermark, 'center', 'center', {
                                      bold: true,
                                      size: 60,
                                      color: '#0000FF',
                                      align: 'center center',
                                      opacity: 0.1
                                  })
                                  .endPage()
                          };
                          pdfDoc.endPDF();
                        
                              // End of the watermark
                           
                            await fs.readFile(`templates/output/${fileName}_${randomNumber}.pdf`, function (err, pdfData) {
                                if (err) { next(err) }
                                var base64dataForRecord = new Buffer.from(pdfData).toString('base64');
                              
                                if (payload.recordId) {
                                    jsforceConnection.sobject('Attachment').create({
                                        ParentId: payload.recordId,
                                        Name: `${fileName}_${randomNumber}.pdf`,
                                        Body: base64dataForRecord,
                                        ContentType: 'application/pdf',
                                    }, function (err, attachment) {
                                        if (err) { next(err) }
                                        else {
                                           // fs.unlinkSync(`templates/passwordProtectedFile/${fileName}_${randomNumber}.pdf`)
                                          //  fs.unlinkSync(`templates/passwordProtectedFile/${fileName}_${randomNumber}.pdf`)
                                            return res.json({
                                                success: true,
                                                error: [],
                                                attachmentId: attachment.id,
                                                fileName: `https://${req.headers.host}/output/${fileName}_${randomNumber}.pdf`,
                                                originalFileName: `https://${req.headers.host}/output/${fileName}_${randomNumber}.${fileExt}`,
                                            })
                                        }
    
                                    })
                                }
                                else {
                                   // fs.unlinkSync(`templates/passwordProtectedFile/${fileName}_${randomNumber}.pdf`)
                                   fs.unlinkSync(`templates/passwordProtectedFile/${fileName}_${randomNumber}.pdf`)
                                    return res.json({
                                        success: true,
                                        error: [],
                                        // attachmentId:attachment.id,
                                        fileName: `https://${req.headers.host}/output/${fileName}_${randomNumber}.pdf`,
                                        originalFileName: `https://${req.headers.host}/output/${fileName}_${randomNumber}.${fileExt}`,
                                    })
                                }
                            })
    
                        })
    
                    })
    
                });
    
            })
        })

       
    }

    catch (err) { next(err) }


})
app.get('/UrlData', async (req, res, next) => {

    if(!req.headers.serverurl){
        return res.json({message:"pass the serverUrl in the header"})
    }
    else if(!req.headers.sessionid){
        return res.json({message:"pass the sessionId in the header"})
    }
    const jsforceConnection = new jsforce.Connection({
        serverUrl :req.headers.serverurl ,
        sessionId :req.headers.sessionid
    })
    
    jsforceConnection.identity(async(err,info)=>{
        if(err){
            return res.json(err)
        }
        var host = jsforceConnection.instanceUrl
        var token = jsforceConnection.accessToken
        var serverUrl = req.query.endPoint
        if (!serverUrl) {
            return res.json({
                error: "Please Enter the Rest endPoint"
            })
        }
        //  '/services/data/v51.0/sobjects/Account/0014x00000Do1PpAAJ'
        // payload={
        //     ...req.body
        // }
        await axios.get(`${host}${serverUrl}`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        }) //reteriving the salesforce object data using axios
            .then(result => {
                delete result.data.attributes
                return res.json({
                    data: result.data
                })
            })
            .catch(err => { return next(err) })

    })
 

})

app.post('/generateDocument', async (req, res, next) => {

    if(!req.headers.serverurl){
        return res.json({message:"pass the serverUrl in the header"})
    }
    else if(!req.headers.sessionid){
        return res.json({message:"pass the sessionId in the header"})
    }
    const jsforceConnection = new jsforce.Connection({
        serverUrl :req.headers.serverurl ,
        sessionId :req.headers.sessionid
    })
    
    jsforceConnection.identity(async(err,info)=>{
        if(err){
            return res.json(err)
        }
        const templateId = req.body.templateId;
        const options = {
            convertTo: "pdf",
            extension: "docx"
        }
        const result = await jsforceConnection.query("SELECT Id, ContentDocumentId, Title, VersionData,PathOnClient, FileType, VersionNumber, ContentBodyId, IsLatest, ContentUrl FROM ContentVersion where IsLatest = true and ContentDocumentId='" + templateId + "'")
        console.log(result)
        if (result.totalSize === 0) {
            return res.json({
                error: "Invalid Template id"
            })
        }
        const fileName = result.records[0].PathOnClient
        const title = result.records[0].Title
        const fileData = await jsforceConnection.sobject('ContentVersion').record(templateId).blob('Body');
        const host = fileData.headers.host
        const path = result.records[0].VersionData
        const token = fileData.headers.Authorization
        const option = {
            hostname: host,
            port: 443,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/octet-stream',
                'Authorization': token
            }
        }
        var request = https.request(option, function (response) {
            var chunks = [];
    
            response.on("data", function (chunk) {
                chunks.push(chunk);
                console.log('chunk')
            });
            response.on("end", async (chunk) => {
                var body = Buffer.concat(chunks);
                fs.writeFileSync(`templates/${fileName}`, body, 'binary');
                //Start of the convert pdf
                await fs.readFile(`./templates/${fileName}`, async (err, result) => {
                    if (err) { console.log(err) }
                    console.log(result)
                    await carbone.convert(result, options, (err, fileData) => {
                        if (err) { console.log(err) }
                        var randomNumber = Math.floor(100000 + Math.random() * 900000);
                        fs.writeFileSync(`./templates/${title}__${randomNumber}.pdf`, fileData);
                        return res.json({
                            success: true,
                            error: [],
                            fileName: `https://${req.headers.host}/${title}__${randomNumber}.pdf`,
                            originalFileName: `https://${req.headers.host}/${fileName}`
                        })
                    })
                })
                //End of the convert pdf
            });
            response.on("error", function (error) {
                return res.json({
                    success: false,
                    error: error
                })
            });
        })
        request.end();
    })
  
})
const storageOfmulter = multer.diskStorage({

    destination: function (req, file, cb) {
        console.log("calling the multer")
        var dir = "./templates/templateFile";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        console.log("caliing filename")
        cb(null, file.originalname);
    },
});
const fileupload = multer({ storage: storageOfmulter });

app.put('/template', fileupload.single("template"), async (req, res, next) => {

    if(!req.headers.serverurl){
        return res.json({message:"pass the serverUrl in the header"})
    }
    else if(!req.headers.sessionid){
        return res.json({message:"pass the sessionId in the header"})
    }
    const jsforceConnection = new jsforce.Connection({
        serverUrl :req.headers.serverurl ,
        sessionId :req.headers.sessionid
    })
    
    jsforceConnection.identity(async(err,info)=>{
        if(err){
            return res.json(err)
        }
        const file = req.file;
        const options = {
            convertTo: "pdf",
            extension: "docx"
        }
        if (!file) {
            return res.json({
                error: "upload the file",
            });
        }
        const templateId = req.body.templateId;
        var templateName = null
        const FetchTemplateFromObject = await jsforceConnection.query(`SELECT Id,templateId__c,Name,LatestVersionId__c FROM Template__c WHERE templateId__c='${templateId}'`)
        templateName = FetchTemplateFromObject.records[0].Name
        let Id = FetchTemplateFromObject.records[0].Id
        let contentDocumentId = FetchTemplateFromObject.records[0].templateId__c
        //console.log("contentDocuementId",contentDocumentId)
    
        fs.copyFile(`./templates/templateFile/${file.originalname}`, `./templates/${templateName}`, async (err, result) => {
    
            if (err) throw err;
            const fileName = templateName
            const lastIndex = fileName.lastIndexOf(".");
            const Stringlength = fileName.length;
            const output = fileName.substr(0, lastIndex) + fileName.substr(Stringlength);
            console.log("output", output)
            //Start of the convert to the pdf
            await fs.readFile(`./templates/${templateName}`, async (err, result) => {
                console.log("base64data")
                var base64data = new Buffer.from(result).toString('base64');
                if (err) { console.log(err) }
                // console.log(result)
                await carbone.convert(result, options, (err, fileData) => {
                    if (err) { console.log(err) }
                    fs.writeFileSync(`./templates/${output}.pdf`, fileData);
                    fs.unlinkSync(`./templates/templateFile/${file.originalname}`);
                })
                jsforceConnection.sobject('ContentVersion').create({
                    'Title': output,
                    'PathOnClient': templateName,
                    'VersionData': base64data,
                    'ContentDocumentId': contentDocumentId
                },
                    async function (err, ret) {
                        if (err) {
                            return console.log(err)
                        }
                        jsforceConnection.sobject("Template__c").update({
                            Id: Id,
                            LatestVersionId__c: ret.id
                        }, function (err, ret) {
                            if (err || !ret.success) { return console.error(err); }
                            return res.json({
                                success: true,
                                error: [],
                                originalFileName: `https://${req.headers.host}/${templateName}`,
                                outputFileName: `https://${req.headers.host}/${output}.pdf`,
                                templateId: contentDocumentId
                            })
    
                            // ...
                        });
    
    
    
                    }
                )
                // jsforceConnection.sobject('ContentVersion').update({
                //     //create
                //     "Id": templateId,
                //     'VersionData':base64data,
                // }, function (err, ret) {
                //     if(err){console.log(err)}
                //     console.log("inside the versiondata")
                //    // if (err || !ret.success) { return console.error(err, ret); }
                //     console.log('Updated Successfully : ');
    
    
                // });
    
            })
            //End of the convert to the pdf
    
        });

    })
 
})
// Error Handling

app.use((error, req, res, next) => {
    const statusCode = error.statusCode || res.statusCode || 500;
    const errorMessage = error.message || error;
    if (statusCode === 500) console.log("app.js", error);
    else console.log("app.js user error", error);

    res.status(statusCode).json({ message: errorMessage });
}); //End of error handling middleware

app.listen(process.env.PORT, () => {
    console.log(`app listening on port ${process.env.PORT}`)
})



