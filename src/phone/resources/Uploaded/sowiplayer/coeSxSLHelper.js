
class coeSxSLHelper {
    #sxslData;
    #workorder;
    #wtmessage;
    #wtsessionid;
    #wtResumeStep;
    #stepActionStatus;

    #actionTimesMap;
    #lastFinishedActionId;

    //Constructor Method for the class
    constructor() {
        this.#actionTimesMap = new Map();
    }

    setWorkOrder(wo) {
        this.#workorder = wo;
    }


    setWorkTrackMessage(message) {
        this.#wtmessage = message;
    }
    getWorkTrackMessage(wo) {
        return this.#wtmessage;
    }

    setWorkTrackSessionId(id) {
        this.#wtsessionid = id;
    }
    getWorkTrackSessionId() {
        return this.#wtsessionid;
    }


    // getWorkTrackResumePreReqOLD (stepNumber){
    //     //return this.#wtResumeStep;

    //     //return [{stepId:"1174dcaa-5002-4011-a14f-53b5f637d204",status:"hold"}]
    //     //return [{stepId:"OP 0010",status:"hold"}]

    //         let stepId = this.#sxslData.steps[stepNumber - 1].id;
    //         return  prereq= [{stepId:stepId,status:"hold", reason:"unknown"}]

    // }

    // Think this is not used
    getWorkTrackResumePreReq(stepId) {

        let steps = this.getSteps();
        let prereq = [];

        try {

            for (var i = 0; i < steps.length; i++) {
                let step = steps[i];

                if (step.id === stepId) {
                    prereq.push({ stepId: step.id, status: "hold" });
                    break;
                } else {
                    prereq.push({ stepId: step.id, status: "done" });

                }
            }

        } catch (error) {
            console.log("Unexpected error in getWorkTrackResumePreReq. Error was " + error.message);
        }

        return prereq;
    }


    // getWorkTrackStepNumberByActionIdOLD (actionId){

    //     let currentStep = 1;
    //     let steps = this.getSteps();
    //     let actionCounter = 0;
    //     let numberOfActions = 0;

    //     try {


    //         for (var i = 0; i < steps.length; i++) {
    //             let step = steps[i];
    //             let actions = step.actions;
    //             numberOfActions = step.actions.length;
    //             actionCounter = 0;

    //             for (var j = 0; j < actions.length; j++) {
    //                 let action = actions[j];
    //                 let id = action.id;
    //                 if (id === actionId) {
    //                     currentStep = i+1;
    //                     break;
    //                 }
    //                 actionCounter++;
    //             }
    //         } 


    //     } catch (error) {
    //         console.log("Unexpected error in getWorkTrackStepIdByActionId. Error was "+ error.message);
    //     }

    //     if (numberOfActions === actionCounter) {
    //         // The last action was completed so the step should be inc remeted by 1
    //         currentStep++;
    //     }

    //     return currentStep;
    // }

    getWorkTrackStepIndexByActionId(actionId) {

        let currentStep = 0;
        let steps = this.getSteps();
        let actionCounter = 0;
        let numberOfActions = 0;

        try {


            outerloop: for (var i = 0; i < steps.length; i++) {
                let step = steps[i];
                let actions = step.actions;
                numberOfActions = step.actions.length;
                actionCounter = 0;

                for (var j = 0; j < actions.length; j++) {
                    let action = actions[j];
                    let id = action.id;
                    if (id === actionId) {
                        currentStep = i + 1;
                        break outerloop;
                    }
                    actionCounter++;
                }

            }


        } catch (error) {
            console.log("Unexpected error in getWorkTrackStepIdByActionId. Error was " + error.message);
        }

        if (numberOfActions === actionCounter && currentStep < steps.length) {
            // The last action was completed so the step should be incremeted by 1
            currentStep++;
        }

        return currentStep;

    }

    getWorkOrder(wo) {
        return this.#workorder;
    }

    getId() {
        //return this.#sxslData.id;
        return this.#sxslData.procName;
    }

    //JH Start 8/2
    setSxSL(d) {
        //This function is to set the overall SxSL data;        
        this.#sxslData = d;
        this.#stepActionStatus = d.steps.map(step => ({
            stepId: step.id,
            actions: step.actions.map(action => ({
                id: action.id,
                actiontitle: action.actiontitle,
                started: false,
                finished: false,
                recorded: false,
                timeStamp: Date.now()
            }))
        }));
    }



    getstepActionStatus() {
        return this.#stepActionStatus;
    }

    getActionRecordedByIds(stepId, actionId) {
        var sarray = this.#stepActionStatus;
        for (let i = 0; i < sarray.length; i++) {
            if (sarray[i].stepId === stepId) {
                for (let j = 0; j < sarray[i].actions.length; j++) {
                    if (sarray[i].actions[j].id === actionId) {
                        return sarray[i].actions[j].recorded;
                    }
                }
            }
        }
        return null; // Return null if no matching stepId and actionId are found
    }

    setActionRecordedValue(stepId, actionId, val) {
        var sarray = this.#stepActionStatus;
        for (let i = 0; i < sarray.length; i++) {
            if (sarray[i].stepId === stepId) {
                for (let j = 0; j < sarray[i].actions.length; j++) {
                    if (sarray[i].actions[j].id === actionId) {
                        sarray[i].actions[j].recorded = val;
                        return;
                    }
                }
            }
        }
    }

    getDescription() {
        return this.#sxslData.introduction.resources[0].text;
    }

    getStepDescriptionById(stepId) {
        let steps = this.#sxslData.steps;
        for (let step of steps) {
            if (step.id === stepId) {
                return step.stepdesc;
            }
        }
        return "Step not found";

    }

    getSteps() {
        return this.#sxslData.steps;
    }

    getStepNum(i) {
        let stepList = this.#sxslData.statements;
        return stepList[i - 1];
    }

    getStepbyID(id) {
        let steps = this.getSteps();
        let stepjson = steps.filter(element => element.id === id)
        return stepjson;
    }

    getStepIdByNum(i) {
        let stepList = this.#sxslData.statements;
        return stepList[i - 1].stepId;
    }


    getTitle() {
        return this.#sxslData.title.resources[0]['text'];
    }

    getStepTitleByID(id) {
        // A LOT of liberties are being taken in this function
        // 
        let stepjson;
        stepjson = this.getStepbyID(id);
        return stepjson[0]['title']['resources'][0]['text'];
    }


    getPublishedDate() {
        return this.#sxslData.publishDate;
    }

    getVersionId() {
        return this.#sxslData.versionId;
    }

    WOScanNeeded() {
        let scanyesno = false;
        //Get the Statement List
        let stepList = this.#sxslData.statements;

        //Check the first statement - First Action to see if it has tool = barcode and fieldname = "WorkOrderNumber"
        if (stepList.length > 0) {
            let stpid = stepList[0].stepId;
            let actionData = this.getStepActionData(stpid);
            if (actionData.length > 0) {
                let actionDetailData = this.getActionDetailData(actionData[0]);
                if (actionDetailData != undefined) {
                    if (actionDetailData.hasOwnProperty("ID")) {
                        //Check Name = WorkOrderNumber                        
                        let id = actionDetailData.ID
                        // trim? for white space and to lower                      
                        if (id.trim().toLowerCase() === "workordernumber") {
                            if (actionDetailData.hasOwnProperty("tool")) {
                                //Check tool = barcode ;
                                let tool = actionDetailData.tool
                                // trim? for white space and to lower                      
                                if (tool.trim().toLowerCase() === "barcode") {
                                    scanyesno = true;
                                }
                            }
                        }
                    }
                }
            }
        }
        return scanyesno;
    }

    //This gets a Steps Action Data
    getStepActionData(sid) {
        let steps = this.getSteps();
        let stepjson = steps.filter(element => element.id === sid)
        let actions = stepjson[0].actions;
        return actions;
    }

    getActionDetailData(actdata) {
        let json;
        if (actdata.hasOwnProperty("details")) {
            json = actdata.details;
        }
        return json;
    }

    setActionStartTime(id, startTime) {
        this.#actionTimesMap.set(id, {
            startTime: startTime,
            endTime: undefined
        });

    }

    setActionEndTime(id, endTime) {

        let duration = 1;
        if (endTime != undefined) {
            this.#actionTimesMap.get(id).endTime = endTime;
            duration = (this.#actionTimesMap.get(id).endTime - this.#actionTimesMap.get(id).startTime) / 1000;

        }

        return duration;
    }

    getActionDuration(id) {

        return (this.#actionTimesMap.get(id).endTime - this.#actionTimesMap.get(id).startTime) / 1000;

    }

    setLastFinishedActionId(id) {
        this.#lastFinishedActionId = id;

    }

    getLastFinishedActionId() {

        return this.#lastFinishedActionId;

    }

    findCaptureString(obj) {
        let captureString = "";
        for (let key in obj) {
            if (Array.isArray(obj[key])) {
                obj[key].forEach(item => {
                    if (typeof item === 'object' && item !== null) {
                        findCaptureString(item);
                    }
                });
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                findCaptureString(obj[key]);
            } else if (key === 'captureString') {
                captureString = obj[key];
            }
        }
    }



    getInputForResponse(response) {

        return findCaptureString(response);

    }


    getWorkOrderStepID() {

        let steps = this.getSteps();
        let id;

        try {
            outerloop: for (var i = 0; i < steps.length; i++) {
                if (steps[i].actions != undefined) {
                    for (var j = 0; j < steps[i].actions.length; j++) {

                        if (steps[i].actions[i].details.ID != undefined) {
                            if (steps[i].actions[i].details.ID.trim().toLowerCase() === "workordernumber") {

                                id = steps[i].id;
                                break outerloop;
                            }
                        }
                    }
                }
            }

        } catch (error) {
            console.log("Unexpected error in getWorkOrderStepID. Error was " + error.message);
        }

        return id;

    }




    // if (step.id === stepId) {
    //     prereq.push({stepId:step.id,status:"hold"});
    //     break;
    // } else {
    //     prereq.push({stepId:step.id,status:"done"});

    // }

    getWorkTrackResumeList(lastFinishedActionId) {
        let steps = this.getSteps();
        let prereq = [];
        let stepIndex = this.getWorkTrackStepIndexByActionId(lastFinishedActionId);

        try {
            for (var i = 0; i < steps.length; i++) {
                if (i == stepIndex) {
                    prereq.push({ stepId: steps[i].id, status: "hold" });
                    //prereq.push({actionId:lastFinishedActionId,status:"pending"});   
                    break;
                } else {
                    prereq.push({ stepId: steps[i].id, status: "done" });
                }
            }
        } catch (error) {
            console.log("Unexpected error in getWorkOrderStepID. Error was " + error.message);
        }
        return prereq;

    }


    //This might be better in the SXSL Helper instead of NGC
    getInputResponseType(responseArray) {
        let inputType = "Unknown Input Type";
        if (responseArray != undefined && responseArray.length > 0) {
            inputType = responseArray[0].type;
        }
        return inputType;
    }

    //This might be better in the SXSL Helper instead of NGC
    getPictureResponse(responseArray) {
        let inputImage;
        if (responseArray[0].response.startsWith("data:image/png;base64")) {
            let contentArray = responseArray[0].response.split(",");
            if (contentArray.length > 1) {
                inputImage = contentArray[1];
            }
        }
        return inputImage;
    }

    //This might be better in the SXSL Helper instead of NGC
    getInputResponse(responseArray) {
        // May Need to consider this
        responseArray.sort(function (a, b) {
            return b.time - a.time;
        });

        // for now get the first response 
        let actionInput = "No Response Data captured...";

        if (responseArray[0].response != undefined) {
            actionInput = responseArray[0].response;
        }

        return actionInput;
    }




}