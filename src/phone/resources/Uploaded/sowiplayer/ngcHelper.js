
class ngcHelper {
    #scope;
    #http;
    #logger;
    #workTrackURLPrefix;
    #sxslHelper;
    #actionPending;
    #doAPIs

    //Constructor Method for the class
    constructor(scp, http, sh, lgr) {
        this.#scope = scp;
        this.#http = http;
        this.#logger = lgr;
        this.#sxslHelper = sh;
        this.#actionPending = false;
        this.#doAPIs = false;
        this.log("The NGC Helper has been loaded and initialized", "Constructor");
    }

    showIssue(message, systemMessage) {        
        this.log("Start", "showIssue");
        this.#scope.setWidgetProp("labelIssueMessage1", "text", message);
        this.#scope.setWidgetProp("labelIssueMessage2", "text", systemMessage);
        this.#scope.setWidgetProp("popupIssue", "visible", true);
        this.#scope.$applyAsync();
    }

    setAPI(b){
        this.#doAPIs = b;
    }

    doAPIs(){
        return this.#doAPIs;
    }

    setActionPending (bval) {
        this.#actionPending = bval;
    }

    getActionPending (){
        return this.#actionPending;
    }

    log(msg, src, indent = undefined) {

        if (this.#logger) {
            if (indent) {
                this.#logger.output(msg, "ngcHelper.js" + " - " + src, indent);
            }
            else {
                this.#logger.output(msg, "ngcHelper.js" + " - " + src);
            }
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

    async startFlow(wonum) {
        this.log ("Method Started", "startFlow")
        if (wonum != undefined && wonum != "") {
            this.#scope.app.params.workordernumber = wonum;
            this.#sxslHelper.setWorkOrder(wonum); // Store the WorkOrder

            let procedureId = this.#sxslHelper.getId();
            if (procedureId != undefined && procedureId != "") {
              
                let status = await this.lookupProcedure(wonum);
                this.log ("Checking Status Value = " + JSON.stringify(status), "startFlow",3);
                if (status.action === "showIntroPopup") {                    
                    showIntroPopup(3, status);      //3 = Refresh & Resume Option
                } else if (status.action === "startNewProcedure") {
                    this.#scope.startNewProcedure();
                } else if (status.action === "showIssue") {
                    this.showIssue(status.message, status.detail);                    
                } else {
                    this.showIssue("Unkown Action", "Start Flow encountered unknown action");
                }
            } else {
                this.showIssue("Unexpected issue. Problem getting the ProcedureId from sowi.", "The sowi.json is located in " + UPLOADPATH);
            }
        } else {
            this.showIssue("Empty value found!", "Please enter a non blank value");
        }
    }

    lookupProcedure = function (wonum) {
        this.log("Start of lookupProcedure, WorkOrder = " + wonum, "lookupProcedure");
        let serviceName = "StartProcedureSession";
        let procedureId = this.#sxslHelper.getId();    // Check for valid procedure name/id
    
        this.#scope.app.params.procedureId = this.#sxslHelper.getId();
        this.#scope.app.params.procedureVersionId = this.#sxslHelper.getVersionId();
    
        let params = {
            appVersion: "iPad6,3; iOS18.1.1",
            procedureLastEditor: "no longer used",
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
    
        return this.makePostRequest(serviceName, params)
            .then(data => {                
                if (data) {
                    this.log("Completed THX request", "lookupProcedure", 1);
                    if (data.data.rows.length > 0) {
    
                        let sessionId = data.data.rows[0].sessionId;
                        this.#scope.app.params.sessionId = sessionId;
                        let message = data.data.rows[0].message;
                        let workOrderProcedureStatus = data.data.rows[0].workOrderProcedureStatus;
                        let lastFinishedActionId = data.data.rows[0].lastFinishedActionId;
    
                        this.#sxslHelper.setWorkTrackSessionId(sessionId);
                        this.#sxslHelper.setWorkTrackMessage(message);
                        //Debug & Tracing
                        this.log ("Message = " + message, "lookupProcedure", 3);
                        this.log ("lastFinishedActionId = " + lastFinishedActionId, "lookupProcedure", 3);
                        this.log ("workOrderProcedureStatus = " + workOrderProcedureStatus, "lookupProcedure", 3);
                        if (message === "OK") {
                            // now check for new or resume
                            if (lastFinishedActionId != undefined && lastFinishedActionId != "" && workOrderProcedureStatus == "started") {
                                this.#sxslHelper.setLastFinishedActionId(data.data.rows[0].lastFinishedActionId);                                    
                                return {action: "showIntroPopup",
                                    wonum: wonum,
                                    workOrderProcedureStatus
                                 };
                            } else if ((lastFinishedActionId === undefined || lastFinishedActionId === "") && workOrderProcedureStatus == "started") {
                                return {action: "startNewProcedure",
                                    wonum: wonum,
                                    workOrderProcedureStatus
                                 };
                            } else {
                                // unknown state maybe                                   
                                return { action: "showIssue",
                                    wonum: wonum,
                                    workOrderProcedureStatus,
                                    message: "Unexpected Issue workOrderProcedureStatus request failed", 
                                    detail: message };
                            }
                        } else {
                            // display possible issue
                            return { action: "showIssue", 
                                wonum: wonum,
                                    workOrderProcedureStatus,
                                message: "Unexpected Issue workOrderProcedureStatus request failed", 
                                detail: message };
                        }
                    } else {
                        return { action: "showIssue", 
                            message: "Unexpected issue no data returned", 
                            detail: "Connect with Administrator to investigate" };
                    }
                }
            }, function (status) {
                console.log("THX Service " + serviceName + " Failure", "Thingworx /PTCSC.SOWI.WorkTrack.Manager/Services/'+ serviceName +' service failed!" + "\n" + "The status returned was:  " + status + "\n");
            })
            .catch(e => {
                console.log("THX Service " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
            });
    }
    

    //Action End Listener
    actionEndProcessing(evt,action){
        this.log("Action End event", "ngcHelper - actionEnd", 2)
        this.log("Step ID: " + action.stepid, "ngcHelper - actionEnd", 2)
        this.log("Action ID: " + JSON.stringify(action.id), "ngcHelper - actionEnd", 4)    
        let x = this.#sxslHelper.getActionRecordedByIds(action.stepid, action.id);
        this.log("getActionRecordedByIds Test: " + x, "ngcHelper - actionEnd", 4)

        if (x != "pending" && x != true) {
            this.log("Here we go, recording Action no Input", "ngcHelper - actionEnd", 6)
            let serviceName = "SaveAction";
            let actionId = action.id;
            let stepId = action.step.id;
            let actionName = action.base.actiontitle;
            let actionInstruction = action.instruction;
            let actionDuration = 1;     //TO-DO: FIX THIS :)
            let inputImage = " ";
            let inputFileExtension = " ";
            let actionInput = "No Input for Action";
            let params = {
                actionDuration: actionDuration,
                actionId: actionId,
                actionInput: actionInput,
                inputFileExtension: inputFileExtension,
                actionDescription: actionInstruction,
                sessionId: this.#sxslHelper.getWorkTrackSessionId(),
                inputImage: inputImage,
                actionName: actionName,
                stepId: stepId
            };

            try {
                this.makePostRequest(serviceName, params)
                    .then(data => {
                        this.setActionPending(false);
                        if (data) {
                            this.log('Completed THX ' + serviceName + ' request - response =' + JSON.stringify(data), "ngcHelper - actionEnd", 2);
                            let saveActionData = data.data;
                            if (data.statusText === "OK" && !saveActionData.rows[0].result.includes('failed')) {
                                this.#sxslHelper.setActionRecordedValue(action.stepid, action.id, true);
                                this.log("Marked Status as written to TWX", "ngcHelper - actionEnd", 6);
                                let pdacts = this.#sxslHelper.getActionRecordedByIds(action.stepid, action.id);
                                this.log("getActionRecordedByIds Test: " + pdacts, "ngcHelper - actionEnd", 6);
                            } else if (saveActionData.rows[0].result.includes('failed')) {
                                this.showIssue("Unexpected Save action failure Params= " + " sessionId=" + data.config.data.sessionId + " stepId=" + data.config.data.stepId + + " actionId=" + data.config.data.actionId + " actionInput=" + data.config.data.actionInput + "  actionName=" + data.config.data.actionName, saveActionData.rows[0].result);
                            }
                        }
                    },
                        function (status) {
                            console.log("THX Service Failure Thingworx /PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " service failed!" + "\n" + "The status returned was:  " + status + "\n");
                            this.showIssue("Unexpected Save action failure ", "Thingworx/PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " failed!" + "\n" + "The status returned was:  " + status + "\n" + "params =" + JSON.stringify(params));
                        }
                    )
            } catch (e) {
                console.log("THX Service " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
                this.showIssue("Unexpected Thingworx " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
            }


        }
    };


    //Start Step Service Call
    startStep = function (sessionId, stepId, stepTitle, stepDescription, stepStartTime) {
        this.log('Function start', "stepStart");
        let serviceName = "StartStep";
        let params = {
          sessionId: sessionId,
          stepId: stepId,
          stepTitle: stepTitle,
          stepDescription: stepDescription
        };
      
        try {
          this.makePostRequest(serviceName, params)
            .then(data => {
              if (data) {
                let startStepData = data.data;
                this.log('Completed THX ' + serviceName, "stepStart", 1);
                this.log('Response: ' + JSON.stringify(data), "stepStart", 1);
                this.log('Status: ' + data.statusText, "stepStart", 1);
                this.log('Result: ' + startStepData.rows[0].result, "stepStart", 1);
      
                if (data.statusText === "OK" && !startStepData.rows[0].result.includes('failed')) {
      
                  // all ok 
                }
                else if (startStepData.rows[0].result.includes('started already')) {
                  // all ignore 
                  this.log('Start Step -  Ignoring failure ' + startStepData.rows[0].result, "stepStart", 2);
                } else if (startStepData.rows[0].result.includes('failed')) {
      
                  this.showIssue("Unexpected StartStep failure Params= " + " sessionId=" + data.config.data.sessionId + " stepId=" + data.config.data.stepId + " stepTitle=" + data.config.data.stepTitle + " stepDescription=" + data.config.data.stepDescription, startStepData.rows[0].result);
      
                }
      
              }
            },
              function (status) {
                console.log("THX Service Failure Thingworx /PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " service failed!" + "\n" + "The status returned was:  " + status + "\n");
      
                this.showIssue("Unexpected StartStep failure ", "Thingworx/PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " failed!" + "\n" + "The status returned was:  " + status + "\n" + "params =" + JSON.stringify(params));
      
              }
            )
        } catch (e) {
          console.log("THX Service " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
          this.showIssue("Unexpected THX Service " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
        }
      
      }





      
actionInputDelivered = function (action) {
    this.log("Action INPUT DELIVERED", "actionInputDelivered")
    this.log("Step ID: " + action.stepid, "actionInputDelivered", 1)
    this.log("Action ID: " + JSON.stringify(action.id), "actionInputDelivered", 1)
  
    this.#sxslHelper.setActionRecordedValue(action.stepid, action.id, 'pending');
    this.log("Marked Status as PENDING", "actionInputDelivered", 1);
  
    let x = this.#sxslHelper.getActionRecordedByIds(action.stepid, action.id);
    this.log("getActionRecordedByIds Test: " + x, "actionInputDelivered", 1);
  
    let serviceName = "SaveAction";
    let actionId = action.id;
    let stepId = action.step.id;
    let responseArray = action.details.response[action.details.ID];
    let actionName = action.base.actiontitle;
    let actionInstruction = action.instruction;
    let actionDuration = 1;
    if (responseArray != undefined && responseArray.length > 0) {
      actionDuration = this.#sxslHelper.setActionEndTime(actionId, responseArray[0].time);
    } else {

        // Laste time  timeStamp from previous step
        let stepStatus = this.#sxslHelper.getstepActionStatus();
        if (stepStatus != undefined && stepStatus != "") {
            actionDuration =  (Date.now() -  stepStatus) / 1000;
        } 
    }
    let inputImage = " ";
    let inputFileExtension = " ";
    let actionInput;
  
    let feedback = this.#sxslHelper.getInputResponseType(responseArray)      //common input response code.
  
    if (feedback === "CaptureString" || feedback === "CaptureNumber") {
      this.setActionPending(false);
      actionInput = this.#sxslHelper.getInputResponse(responseArray)      //common input response code.
    }
  
    if (feedback === "CaptureImage") {
      this.setActionPending(true);     //Slowing down processing to address the upload of an Image
      inputImage = this.#sxslHelper.getPictureResponse(responseArray)
      inputFileExtension = "png";
    }
  
    let params = {
      actionDuration: actionDuration,
      actionId: actionId,
      actionInput: actionInput,
      inputFileExtension: inputFileExtension,
      actionDescription: actionInstruction,
      sessionId: this.#sxslHelper.getWorkTrackSessionId(),
      inputImage: inputImage,
      actionName: actionName,
      stepId: stepId
    };
  
    try {
      this.makePostRequest(serviceName, params)
        .then(data => {
          this.setActionPending(false);       //Turn off the indicator that a write was taking place.  Need this when a picture is being written to ThingWorx, because it takes a bit longer.
          if (data) {            
            let saveActionData = data.data;
            this.log('Completed THX ' + serviceName, "actionInputDelivered", 3);
            this.log('Response: ' + JSON.stringify(data), "actionInputDelivered", 3);
            this.log('Status: ' + data.statusText, "actionInputDelivered", 3);
            this.log('Result: ' + saveActionData.rows[0].result, "actionInputDelivered", 3);            
  
            if (data.statusText === "OK" && !saveActionData.rows[0].result.includes('failed')) {
              this.#sxslHelper.setActionRecordedValue(action.stepid, action.id, true);   //Setting value to help when we need to capture an Action with no Input.
            } else if (saveActionData.rows[0].result.includes('failed')) {
              this.showIssue("Unexpected Save action failure Params= " + " sessionId=" + data.config.data.sessionId + " stepId=" + data.config.data.stepId + + " actionId=" + data.config.data.actionId + " actionInput=" + data.config.data.actionInput + "  actionName=" + data.config.data.actionName, saveActionData.rows[0].result);
            }
          }
        },
          function (status) {
            this.log("THX Service Failure Thingworx /PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " service failed!" + "\n" + "The status returned was:  " + status + "\n", "actionInputDelivered", 4);
            this.showIssue("Unexpected Save action failure ", "Thingworx/PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " failed!" + "\n" + "The status returned was:  " + status + "\n" + "params =" + JSON.stringify(params));
  
          }
        )
    } catch (e) {
      console.log("THX Service " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
      this.showIssue("Unexpected Thingworx " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
    }
  
  
  
  
  
  }
  
  
endProcedure = function () {
    this.log("Procedure End:", "endProcedure", 2);  
    let serviceName =  "SetWorkOrderProcedureStatus" ;
    try {  
      let params = {
        workOrderNumber: $rootScope.sxslHelper.getWorkOrder(),
        procedureId: $rootScope.sxslHelper.getId(),
        procedureVersion: $rootScope.sxslHelper.getVersionId(),
        status : "finished"
      };
  
      this.makePostRequest(serviceName, params)
        .then(data => {
          if (data) {
            this.log('Completed THX ' + serviceName, 'endProcedure', 2);
            this.log('Response =' + JSON.stringify(data), 'endProcedure', 2);
            let endStepData = data.data;
            if (data.statusText === "OK" && !endStepData.rows[0].result.includes('failed')) {
              // all ok 
            } else if (saveActionData.rows[0].result.includes('failed')) {
              this.showIssue("Unexpected EndProcedureSession failure ", endStepData.rows[0].result);
            }
          }
        },
          function (status) {
            console.log("THX Service " + serviceName + " Failure Thingworx /PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " service failed!" + "\n" + "The status returned was:  " + status + "\n");
            this.showIssue("Unexpected Save action failure ", "Thingworx/PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " failed!" + "\n" + "The status returned was:  " + status + "\n" + "params =" + JSON.stringify(params));  
          }
        )
  
    } catch (e) {
      console.log("THX Service " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
      this.showIssue("Unexpected Save action failure ", "THX Service " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
    }  
  }

  endStep = function (sessionId, stepId, acknowledgement) {
    try {
      let serviceName = "EndStep";    
      let params = {
        sessionId: sessionId,
        stepId: stepId,
        acknowledgement: acknowledgement
  
      };
     this.makePostRequest(serviceName, params)
        .then(data => {
          if (data) {
            this.log('Completed THX ' + serviceName, "endStep", 2);            
            this.log('Response =' + JSON.stringify(data), "endStep", 2);
            this.log('Completed THX ' + serviceName + ' request - response =' + JSON.stringify(data), "endStep", 2);
            let endStepData = data.data;
            if (data.statusText === "OK" && !endStepData.rows[0].result.includes('failed')) {
              // all ok 
            } else if (endStepData.rows[0].result.includes('failed')) {
             this.showIssue("Unexpected EndStep failure Params= stepId=" + data.config.data.stepId + " WorkOrderNumber=" + $scope.app.params.workordernumber, endStepData.rows[0].result);
            }
          }
        },
          function (status) {
            console.log("THX Service " + serviceName + " Failure Thingworx /PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " service failed!" + "\n" + "The status returned was:  " + status + "\n");
           this.showIssue("Unexpected EndStep failure ", "Thingworx/PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " failed!" + "\n" + "The status returned was:  " + status + "\n" + "params =" + JSON.stringify(params));
          }
        )
  
  
    } catch (e) {
      console.log("THX Service " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
     this.showIssue("Unexpected THX Service " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
    }
  }
  



    //End of Class Definition
}