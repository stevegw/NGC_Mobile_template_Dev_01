
class ngcHelper {
    #scope;
    #http;
    #logger;
    #workTrackURLPrefix;
    #sxslHelper;

    //Constructor Method for the class
    constructor(scp, http, sh, lgr) {
        this.#scope = scp;
        this.#http = http;
        this.#logger = lgr;
        this.#sxslHelper = sh;
        this.log("The NGC Helper has been loaded and initialized", "Constructor");
    }

    showIssue(message, systemMessage) {
        this.log("Start", "showIssue");
        this.#scope.setWidgetProp("labelIssueMessage1", "text", message);
        this.#scope.setWidgetProp("labelIssueMessage2", "text", systemMessage);
        this.#scope.setWidgetProp("popupIssue", "visible", true);
    }

    log(msg, src) {

        if (this.#logger) {
            this.#logger.output(msg, "ngcHelper.js" + " - " + src);
        }
        else {
            console.log("****  " + src + ": " + msg);
        }
    }

    setWorkTrackURLPrefix(wturl) {
        this.#workTrackURLPrefix = wturl;
    }

    makePostRequest(serviceName, params) {
        let URL = this.#workTrackURLPrefix + serviceName;
        let headers = {
            Accept: 'application/json',
            "Content-Type": 'application/json'
        };

        return this.#http.post(URL, params, { headers: headers })
            .then(response => response)
            .catch(error => {
                this.log(`Service ${serviceName} failed:` + error, "makePostRequest");
                console.error(`Service ${serviceName} failed:`, error);
                this.showIssue(`Unexpected ${serviceName} failure`, error.message);
            });
    }

    startFlow(wonum) {
        if (wonum != undefined && wonum != "") {
            this.#scope.app.params.workordernumber = wonum;
            this.#sxslHelper.setWorkOrder(wonum); // Store the WorkOrder

            let procedureId = this.#sxslHelper.getId();
            if (procedureId != undefined && procedureId != "") {
                this.lookupProcedure(wonum);
            } else {
                this.showIssue("Unexpected issue. Problem getting the ProcedureId from sowi.", "The sowi.json is located in " + UPLOADPATH);
            }
        } else {
            this.showIssue("Empty value found!", "Please enter a non blank value");
        }
    }


    lookupProcedure = function (wonum) {
        let serviceName = "StartProcedureSession";
        let procedureId = this.#sxslHelper.getId();    // Check for valid procedure name/id

        this.#scope.app.params.procedureId = this.#sxslHelper.getId();
        this.#scope.app.params.procedureVersionId = this.#sxslHelper.getVersionId();

        let params = {
            appVersion: "iPad6,3; iOS18.1.1",
            procedureLastEditor: "no lonegr used",
            procedureVersion: this.#sxslHelper.getVersionId(),
            procedureDescription: this.#sxslHelper.getDescription(),
            relatedProduct: "Future feature - Some related Product" /* STRING */,
            relatedAsset: "Future feature - Some related Asset" /* STRING */,
            workOrderNumber: wonum /* STRING */,
            language: "en-US" /* STRING */,
            devicePlatform: "mobile" /* STRING */,
            procedureId: procedureId /* STRING */,
            procedureTitle: this.#sxslHelper.getTitle() /* STRING */
        };

        try {
            this.makePostRequest(serviceName, params)
                .then(data => {
                    if (data) {
                        this.log('Completed THX request', JSON.stringify(data.config.data), "startPoint.js - lookupProcedure");
                        if (data.data.rows.length > 0) {

                            let sessionId = data.data.rows[0].sessionId;
                            this.#scope.app.params.sessionId = sessionId;
                            let message = data.data.rows[0].message;
                            let workOrderProcedureStatus = data.data.rows[0].workOrderProcedureStatus;
                            let lastFinishedActionId = data.data.rows[0].lastFinishedActionId;

                            this.#sxslHelper.setWorkTrackSessionId(sessionId);
                            this.#sxslHelper.setWorkTrackMessage(message);
                            if (message === "OK") {
                                // now check for new or resume
                                if (lastFinishedActionId != undefined && lastFinishedActionId != "" && workOrderProcedureStatus == "started") {
                                    // Resume

                                    this.#sxslHelper.setLastFinishedActionId(data.data.rows[0].lastFinishedActionId);
                                    // refresh and resume buttons 
                                    this.#scope.setWidgetProp("labelUserMessage", "text", "Procedure with #" + wonum + " has already '" + workOrderProcedureStatus + "' Click Start New  WorkOrder or Resume");
                                    showHideProcButtons(false, true, true, false, false);
                                    showIntroPopup();

                                } else if ((lastFinishedActionId === undefined || lastFinishedActionId === "") && workOrderProcedureStatus == "started") {

                                    this.#scope.startNewProcedure();

                                }  else {
                                    // unknown state maybe 
                                    this.showIssue("Unexpected Issue workOrderProcedureStatus request failed", message);

                                }

                            } else {

                                if ( message.includes('Error') && message.includes('permission to see procedure') ) {
                                    // see if you can spli the message
                                    let splitArray = message.split("Error");
                                    if (splitArray.length >= 3 ) {
                                        this.showIssue("Please check your permissions", splitArray[2]);
                                    } else {
                                        this.showIssue("Please check your permissions", message);
                                    }

                                    
                                } else {
                                    // display possible issue
                                    this.showIssue("Unexpected Issue workOrderProcedureStatus request failed", message);
                                }
                 

                            }

                        } else {

                            // display possible issue
                            this.showIssue("Unexpected issue no data returned  ", " Connect with Administrator to investigate");
                        }

                    }
                },
                    function (status) {
                        console.log("THX Service " + serviceName + " Failure", "Thingworx /PTCSC.SOWI.WorkTrack.Manager/Services/'+ serviceName +' service failed!" + "\n" + "The status returned was:  " + status + "\n");
                    }
                )
        } catch (e) {
            console.log("THX Service " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
        }

    }


}