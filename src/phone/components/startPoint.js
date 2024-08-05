console.log($scope.app);
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Globals
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const UPLOADPATH = "app/resources/Uploaded/";

if (!SXSLData){
  let SXSLData;
}
if (!ShowStartSplash){
  let ShowStartSplash = true;
}
const DEBUG = JSON.parse($scope.app.params.jloggerdebug);

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// local helper functions
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
getJSON = function (data) {
  SXSLData = JSON.parse(data);
}

showIntroPopup = function () {
  $scope.setWidgetProp("labelProcDescription", "text", SXSLData.title.resources[0].text);
  $scope.setWidgetProp("labelProcVersion", "text", SXSLData.versionId);

  let dateStr = SXSLData.publishDate;
  let dateObj = new Date(dateStr);
  let readableDate = dateObj.toLocaleString();
  $scope.setWidgetProp("labelProcPubDate", "text", readableDate);
  try {
    $scope.setWidgetProp("labelProcIntro", "text", SXSLData.introduction.resources[0].text);
  } catch (err) {
    //ignore 
    $scope.setWidgetProp("labelProcIntro", "text", "No introduction found");
  }

  $scope.setWidgetProp("popupIntro", "visible", true);

}

showHideProcButtons = function (showWorkOrder, showHideNewProc, showHideResumeProc, showHideInputWO, showHideEnterButton) {

  $scope.setWidgetProp("buttonScanForWorkOrder", "visible", showWorkOrder);
  $scope.setWidgetProp("buttonStartNewProc", "visible", showHideNewProc);
  $scope.setWidgetProp("buttonResumeProc", "visible", showHideResumeProc);

  $scope.setWidgetProp("textInputWorkOrder", "visible", showHideInputWO);
  $scope.setWidgetProp("buttonEnter", "visible", showHideEnterButton);



}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Exposed Studio Functions
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

$scope.toggleInfo = function () {

  let state = $scope.getWidgetProp("popupHelp", "visible");
  let result = state === "visible" ? $scope.setWidgetProp("popupIntro", "visible", false) : $scope.setWidgetProp("popupIntro", "visible", true);
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// EVENTS
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//
// Will execute when the STEP STARTS - stepStart
//
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

$rootScope.$on('stepStart', function (evt, step) {
  $rootScope.logger.output("Step Start", "startPoint.js - stepStart Listener")
  if ($scope.app.params.sessionId != undefined) {
    let stepTitle = $rootScope.sxslHelper.getTitle();
    let stepDescription = $rootScope.sxslHelper.getStepDescriptionById(step.id);
    let stepStartTime = Date.now();
    let si = $rootScope.sxslHelper.getWorkTrackSessionId();
    $rootScope.startStep(si, step.id, step.title, stepDescription, stepStartTime);
  }


});

$rootScope.startStep = function (sessionId, stepId, stepTitle, stepDescription, stepStartTime) {
  let serviceName = "StartStep";  
  let params = {
    sessionId: sessionId,
    stepId: stepId,
    stepTitle: stepTitle,
    stepDescription: stepDescription
  };

  try {
    $rootScope.ngcCommon.makePostRequest(serviceName, params)
      .then(data => {
        if (data) {
          $rootScope.logger.output('Completed THX ' + serviceName + ' request - response =' + JSON.stringify(data), "startPoint.js - stepStart", 2);
          let startStepData = data.data;

          if (data.statusText === "OK" && !startStepData.rows[0].result.includes('failed')) {

            // all ok 
          }
          else if (startStepData.rows[0].result.includes('started already')) {
            // all ignore 
            $rootScope.logger.output('Start Step -  Ignoring failure ' + startStepData.rows[0].result, "startPoint.js - stepStart", 2);
          } else if (startStepData.rows[0].result.includes('failed')) {

            $rootScope.ngcCommon.showIssue("Unexpected StartStep failure Params= " + " sessionId=" + data.config.data.sessionId + " stepId=" + data.config.data.stepId + " stepTitle=" + data.config.data.stepTitle + " stepDescription=" + data.config.data.stepDescription, startStepData.rows[0].result);

          }

        }
      },
        function (status) {
          console.log("THX Service Failure Thingworx /PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " service failed!" + "\n" + "The status returned was:  " + status + "\n");

          $rootScope.ngcCommon.showIssue("Unexpected StartStep failure ", "Thingworx/PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " failed!" + "\n" + "The status returned was:  " + status + "\n" + "params =" + JSON.stringify(params));

        }
      )
  } catch (e) {
    console.log("THX Service " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
    $rootScope.ngcCommon.showIssue("Unexpected THX Service " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
  }

}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//
// Will execute when the ACTION STARTS - actionStart
//
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

$rootScope.$on('actionStart', function (evt, action) {
  let actionId = action.id;
  let actionInput = 'test input'; // place holder
  let inputFileExtension = '';
  let actionDescription = action.instruction;
  let sessionId = $rootScope.sxslHelper.getWorkTrackSessionId();
  let inputImage = " ";
  let actionName = action.base.actiontitle;
  $rootScope.sxslHelper.setActionStartTime(action.id, new Date().getTime());
  let step = $rootScope.sxslHelper.getStepbyID(action.stepid);
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//
// Will execute when the ACTION DELIVERED - actionInputDelivered
//
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
$rootScope.$on('actionInputDelivered', function (evt, action) {
  $rootScope.actionInputDelivered(action.action);
})

$rootScope.actionInputDelivered = function (action) {
  $rootScope.logger.output("Action INPUT DELIVERED", "startPoint.js - actionInputDelivered")
  $rootScope.logger.output("Step ID: " + action.stepid, "startPoint.js - actionInputDelivered", 2)
  $rootScope.logger.output("Action ID: " + JSON.stringify(action.id), "startPoint.js - actionInputDelivered", 4)

  $rootScope.sxslHelper.setActionRecordedValue(action.stepid, action.id, 'pending');
  $rootScope.logger.output("Marked Status as PENDING", "startPoint.js - actionInputDelivered", 4);

  let x = $rootScope.sxslHelper.getActionRecordedByIds(action.stepid, action.id);
  $rootScope.logger.output("getActionRecordedByIds Test: " + x, "startPoint.js - actionInputDelivered", 4);

  let serviceName = "SaveAction"; 
  let actionId = action.id;
  let stepId = action.step.id;
  let responseArray = action.details.response[action.details.ID];
  let actionName = action.base.actiontitle;
  let actionInstruction = action.instruction;
  let actionDuration = $rootScope.sxslHelper.setActionEndTime(actionId, responseArray[0].time);
  let inputImage = " ";
  let inputFileExtension = " ";
  let actionInput;

  let feedback = $rootScope.sxslHelper.getInputResponseType(responseArray)      //common input response code.
  
  if (feedback === "CaptureString" || feedback === "CaptureNumber"){
    $rootScope.actionPending = false;
    actionInput = $rootScope.sxslHelper.getInputResponse(responseArray)      //common input response code.
  }

  if (feedback === "CaptureImage"){
    $rootScope.actionPending = true;    //Slowing down processing to address the upload of an Image
    inputImage = $rootScope.sxslHelper.getPictureResponse(responseArray)      
    inputFileExtension = "png";
  }

  let params = {
    actionDuration: actionDuration,
    actionId: actionId,
    actionInput: actionInput,
    inputFileExtension: inputFileExtension,
    actionDescription: actionInstruction,
    sessionId: $rootScope.sxslHelper.getWorkTrackSessionId(),
    inputImage: inputImage,
    actionName: actionName,
    stepId: stepId
  };

  try {
    $rootScope.ngcCommon.makePostRequest(serviceName, params)
      .then(data => {
        $rootScope.actionPending = false;       //Turn off the indicator that a write was taking place.  Need this when a picture is being written to ThingWorx, because it takes a bit longer.
        if (data) {
          $rootScope.logger.output('Completed THX ' + serviceName + ' request - response =' + JSON.stringify(data), "startPoint.js - actionInputDelivered", 2);
          let saveActionData = data.data;

          if (data.statusText === "OK" && !saveActionData.rows[0].result.includes('failed')) {
            $rootScope.sxslHelper.setActionRecordedValue(action.stepid, action.id, true);   //Setting value to help when we need to capture an Action with no Input.
          } else if (saveActionData.rows[0].result.includes('failed')) {
            $rootScope.ngcCommon.showIssue("Unexpected Save action failure Params= " + " sessionId=" + data.config.data.sessionId + " stepId=" + data.config.data.stepId + + " actionId=" + data.config.data.actionId + " actionInput=" + data.config.data.actionInput + "  actionName=" + data.config.data.actionName, saveActionData.rows[0].result);
          }
        }
      },
        function (status) {
          $rootScope.logger.output ("THX Service Failure Thingworx /PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " service failed!" + "\n" + "The status returned was:  " + status + "\n","startPoint.js - actionInputDelivered", 4);
          $rootScope.ngcCommon.showIssue("Unexpected Save action failure ", "Thingworx/PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " failed!" + "\n" + "The status returned was:  " + status + "\n" + "params =" + JSON.stringify(params));

        }
      )
  } catch (e) {
    console.log("THX Service " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
    $rootScope.ngcCommon.showIssue("Unexpected Thingworx " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
  }





}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//
// Will execute when the STEP ENDS - stepEnd
//
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
$rootScope.$on('stepEnd', function (evt, step) {
  $rootScope.logger.output("Step End", "startPoint.js - stepEnd Listener")

  let acknowledgement = "...";
  let sessionId = $rootScope.sxslHelper.getWorkTrackSessionId();
  let acktype = step.ack.type;

  switch (step.ack.type) {

    case "Confirmation":

      acknowledgement = step.ack.response === "y" ? "Yes" : step.ack.response;
      break;

    case "PassFail":

      let resonType = step.ack.hasOwnProperty('reasonType');
      if (!resonType) {
        if (step.ack.response === "y") {
          acknowledgement = "Yes"
        }
        else if (step.ack.response === "f") {
          acknowledgement = "Fail";
        } else if (step.ack.response === "p") {
          acknowledgement = "Pass";
        } else {
          acknowledgement = step.ack.response;
        }
      } else {
        //complex type 
        if (step.ack.reasonType === "Code") {
          let found = false;
          for (let i = 0; i < step.ack.reasonCodes.length; i++) {
            if (step.ack.reasonCodes[i].code === step.ack.response) {
              acknowledgement = step.ack.reasonCodes[i].resources[0].text;
              found = true;
              break;
            }
          }
          if (!found) {
            acknowledgement = step.ack.response;
          }
        }
      }
      break;

    default:
      acknowledgement = step.ack.response;
      break;
  }

  var checkActionPending = setInterval(function () {
    if (!$rootScope.actionPending) {
      $rootScope.endStep(sessionId, step.id, acknowledgement);
      clearInterval(checkActionPending);
    }
  }, 1000); // checks every 1000 milliseconds (1 second)


});

$rootScope.endStep = function (sessionId, stepId, acknowledgement) {


  try {
    let serviceName = "EndStep";    
    let params = {
      sessionId: sessionId,
      stepId: stepId,
      acknowledgement: acknowledgement

    };
    $rootScope.ngcCommon.makePostRequest(serviceName, params)
      .then(data => {
        if (data) {
          $rootScope.logger.output('Completed THX ' + serviceName + ' request - response =' + JSON.stringify(data), "startPoint.js - endStep", 2);
          let endStepData = data.data;
          if (data.statusText === "OK" && !endStepData.rows[0].result.includes('failed')) {
            // all ok 
          } else if (endStepData.rows[0].result.includes('failed')) {
            $rootScope.ngcCommon.showIssue("Unexpected EndStep failure Params= stepId=" + data.config.data.stepId + " WorkOrderNumber=" + $scope.app.params.workordernumber, endStepData.rows[0].result);
          }
        }
      },
        function (status) {
          console.log("THX Service " + serviceName + " Failure Thingworx /PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " service failed!" + "\n" + "The status returned was:  " + status + "\n");

          $rootScope.ngcCommon.showIssue("Unexpected EndStep failure ", "Thingworx/PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " failed!" + "\n" + "The status returned was:  " + status + "\n" + "params =" + JSON.stringify(params));
        }
      )


  } catch (e) {
    console.log("THX Service " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
    $rootScope.ngcCommon.showIssue("Unexpected THX Service " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
  }
}

// 
// Will execute when the Procedure is finshed.
//
$rootScope.$on('procEnd', function (evt, procedure) {
  $rootScope.logger.output("Procedure End:", "startPoint.js - procEnd Listener")
  let sessionId = $rootScope.sxslHelper.getWorkTrackSessionId();
  $rootScope.endProcedure(sessionId);
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//
// Will execute when the PROCEDURE END - EndProcedureSession
//
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

$rootScope.endProcedure = function (sessionId) {
  $rootScope.logger.output("Procedure End:", "startPoint.js - endProcedure", 2);
  let serviceName = "EndProcedureSession";  
  try {


    let params = {
      sessionId: sessionId
    };
    $rootScope.ngcCommon.makePostRequest(serviceName, params)
      .then(data => {
        if (data) {
          $rootScope.logger.output('Completed THX ' + serviceName + ' request - response =' + data, 'startPoint.js - endProcedure', 2);
          let endStepData = data.data;
          if (data.statusText === "OK" && !endStepData.rows[0].result.includes('failed')) {
            // all ok 
          } else if (saveActionData.rows[0].result.includes('failed')) {
            $rootScope.ngcCommon.showIssue("Unexpected EndProcedureSession failure ", endStepData.rows[0].result);
          }
        }
      },
        function (status) {
          console.log("THX Service " + serviceName + " Failure Thingworx /PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " service failed!" + "\n" + "The status returned was:  " + status + "\n");

          $rootScope.ngcCommon.showIssue("Unexpected Save action failure ", "Thingworx/PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " failed!" + "\n" + "The status returned was:  " + status + "\n" + "params =" + JSON.stringify(params));

        }
      )



  } catch (e) {
    console.log("THX Service " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
    $rootScope.ngcCommon.showIssue("Unexpected Save action failure ", "THX Service " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
  }



}

$scope.checkForScan = function () {
  let scanneeded = $rootScope.sxslHelper.WOScanNeeded();
  if (scanneeded) {
    $scope.setWidgetProp("labelUserMessage", "text", "Procedure Needs a Work Order Number");
  }
  else {
    // No WorkOrder needed.
    $scope.setWidgetProp("labelUserMessage", "text", "Click New to start Procedure");
  }

  showHideProcButtons(true, false, false, true, true);
  showIntroPopup();
}

$scope.scanComplete = function () {
  $scope.handleWorkOrderEntry(false);
}

$scope.handleWorkOrderEntry = function (isManual) {
  let wonum;
  if (isManual) {
    wonum = $scope.getWidgetProp("textInputWorkOrder", "text");
  } else {
    wonum = $scope.getWidgetProp('scanWorkOrder', 'scannedValue');
  }
  $rootScope.ngcCommon.startFlow(wonum);
}

$scope.systemFullyInit = function () {
  $scope.checkForScan();
  $scope.app.params.prefill = "";
}

$scope.startNewProcedure = function () {
  $rootScope.sxslHelper.setFreshRun(true);

  if ($rootScope.sxslHelper.getWorkOrder() !== undefined && $rootScope.sxslHelper.getWorkOrder() !== "") {

    let stepId = $rootScope.sxslHelper.getStepIdByNum(2);
    $scope.app.params.prefill = $rootScope.sxslHelper.getWorkTrackResumePreReq(stepId);

    let firstStepId = $rootScope.sxslHelper.getStepIdByNum(1);
    $scope.app.params.firstStepID = firstStepId;

  }

  $scope.app.fn.navigate("Home");

}

$scope.resetForNewProcedure = function () {
  $rootScope.sxslHelper.setFreshRun(true);
  $scope.setWidgetProp("labelUserMessage", "text", "Click New to start Procedure");
  showHideProcButtons(true, false, false, true, true);
  showIntroPopup();
}

$scope.resumeProcedure = function () {
  $rootScope.sxslHelper.setFreshRun(false);

  try {
    let lastFinishedActionId = $rootScope.sxslHelper.getLastFinishedActionId();
    if (lastFinishedActionId != undefined & lastFinishedActionId != "") {

      $rootScope.getCompletedSteps(lastFinishedActionId);

    }

  } catch (error) {

    $rootScope.ngcCommon.showIssue("Unexpected issue. Problem finding the last resume step.", error.message);
  }
}

$rootScope.getCompletedSteps = function (lastFinishedActionId) {

  let completedSteps = [];
  let serviceName = "GetWorkOrderProcedureSteps";  
  let params = {
    workOrderNumber: $scope.app.params.workordernumber,
    procedureId: $rootScope.sxslHelper.getId(),
    procedureVersion: $rootScope.sxslHelper.getVersionId()

  };

  try {
    $rootScope.ngcCommon.makePostRequest(serviceName, params)
      .then(data => {
        if (data) {
          $rootScope.logger.output('Completed THX ' + serviceName + ' request - response =' + JSON.stringify(data), "startPoint.js - getCompletedSteps", 2);
          let map = new Map();
          function addEntry(key, value) {
            if (!map.has(key)) {
              map.set(key, value);
              console.log(`Added: ${key} -> ${value}`);
            } else {
              console.log(`Key "${key}" already exists with value "${map.get(key)}". No duplicates allowed.`);
            }
          }

          data.data.rows.forEach(function (step) {
            if (step.stepStatus === "finished") {
              addEntry(step.stepId, "done");
            }
          });

          let workInstructionId = $rootScope.sxslHelper.getWorkOrderStepID();
          if (workInstructionId) {
            addEntry(workInstructionId, "done");
          }

          data.data.rows.forEach(function (step) {
            addEntry(step.stepId, "hold");
          });

          for (let key of map.keys()) {
            console.log(key);
            completedSteps.push({ stepId: key, status: map.get(key) });
          }
          if (lastFinishedActionId) {
            completedSteps.push({ actionId: lastFinishedActionId, status: "hold" });
          }

          $scope.app.params.prefill = $rootScope.sxslHelper.getWorkTrackResumeList(lastFinishedActionId);
          $scope.app.fn.navigate("Home");

        } else {
          // display possible issue
          $rootScope.ngcCommon.showIssue("Unexpected issue no data returned from service " + serviceName + "with params " + JSON.stringify(params), " Connect with Administrator to investigate");
        }

      },
        function (status) {
          console.log("Thingworx /PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + "  service failed!" + "\n" + "The status returned was:  " + status + "\n");
        }
      )
  } catch (e) {
    console.log("Thingworx /PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " failed", 'Check application key or if server is running or error was ' + e);
  }



}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Load Libary functions - loadLibrary will launch on loading the experience 
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function loadLibrary(src) {
  return new Promise(function (resolve, reject) {
    var head = document.head || document.getElementsByTagName('head')[0],
      script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'app/resources/' + src;
    head.appendChild(script);
    script.onload = resolve; // Resolve when script is loaded
    script.onerror = reject; // Reject if loading fails
  });
}

if (!$rootScope.logger) {
  loadLibrary("Uploaded/sowiplayer/jlogger.js")
    .then(function () {
      $rootScope.logger = new Jlogger("SOWI NGC Player", "GLOBAL")
      $rootScope.logger.setShowOutput(DEBUG);
      $rootScope.logger.output("Logger is initializated and ready", "Start.js - loadLibary");
      //Custom Logger
      //Sample
      // $rootScope.logger.output("Scan is finished, VIN = " + scaninfo, "scanfinshed")
      // $rootScope.logger.output(<message>, <location -OPTIONAl>, <depth -OPTIONAL>)
      if (!$rootScope.sxslHelper) {
        loadLibrary('Uploaded/sowiplayer/coeSxSLHelper.js')
          .then(function () {
            $rootScope.sxslHelper = new coeSxSLHelper($scope)
            loadLibrary('Uploaded/sowiplayer/ngcHelper.js')
              .then(function () {
                $rootScope.ngcCommon = new ngcHelper($scope, $http, $rootScope.sxslHelper, $rootScope.logger)
                $rootScope.ngcCommon.setWorkTrackURLPrefix('/Thingworx/Things/PTCSC.SOWI.WorkTrack.Manager/Services/')
                var filepath = "./app/resources/Uploaded/sowi.json";
                fetch(filepath)
                  .then(response => response.text())
                  .then(data => getJSON(data))
                  .then(data => $rootScope.sxslHelper.setSxSL(SXSLData))
                  .then(function () {
                    $scope.systemFullyInit();
                  })
                  .finally(function () {
                    // Do any clean up
                    //console.log (">>>> getJSON: Working on Data >>>"+ JSON.stringify(SXSLData));

                  })
                  .catch(function (error) {
                    console.log(' #### JSON Fetch Error #### ', error);
                    $rootScope.ngcCommon.showIssue("Problem reading sowi.json file. Please check in Uploaded location for sowi.json file.", error.message);
                  });
              })
              .catch(function (error) {
                console.error('Error loading library:', error);
              });
          })
      }
    })
}

$rootScope.$on('actionEnd', function (evt, action) {
  $rootScope.logger.output("Action End event", "startPoint.js - actionEnd")
  $rootScope.logger.output("Step ID: " + action.stepid, "startPoint.js - actionEnd", 2)
  $rootScope.logger.output("Action ID: " + JSON.stringify(action.id), "startPoint.js - actionEnd", 4)
  x = $rootScope.sxslHelper.getActionRecordedByIds(action.stepid, action.id);
  $rootScope.logger.output("getActionRecordedByIds Test: " + x, "startPoint.js - actionEnd", 4)

  if (x != "pending" && x != true) {
    $rootScope.logger.output("Here we go, recording Action no Input", "startPoint.js - actionEnd", 6)
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
      sessionId: $rootScope.sxslHelper.getWorkTrackSessionId(),
      inputImage: inputImage,
      actionName: actionName,
      stepId: stepId
    };

    try {
      $rootScope.ngcCommon.makePostRequest(serviceName, params)
        .then(data => {
          $rootScope.actionPending = false;
          if (data) {
            $rootScope.logger.output('Completed THX ' + serviceName + ' request - response =' + JSON.stringify(data), "startPoint.js - actionEnd", 2);
            let saveActionData = data.data;
            if (data.statusText === "OK" && !saveActionData.rows[0].result.includes('failed')) {
              // all ok 
              //JH Start 8/2
              $rootScope.sxslHelper.setActionRecordedValue(action.stepid, action.id, true);
              $rootScope.logger.output("Marked Status as written to TWX", "startPoint.js - actionEnd", 6);
              y = $rootScope.sxslHelper.getActionRecordedByIds(action.stepid, action.id);
              $rootScope.logger.output("getActionRecordedByIds Test: " + y, "startPoint.js - actionEnd", 6);
              //JH End 8/2
            } else if (saveActionData.rows[0].result.includes('failed')) {
              $rootScope.ngcCommon.showIssue("Unexpected Save action failure Params= " + " sessionId=" + data.config.data.sessionId + " stepId=" + data.config.data.stepId + + " actionId=" + data.config.data.actionId + " actionInput=" + data.config.data.actionInput + "  actionName=" + data.config.data.actionName, saveActionData.rows[0].result);
            }
          }
        },
          function (status) {
            console.log("THX Service Failure Thingworx /PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " service failed!" + "\n" + "The status returned was:  " + status + "\n");
            $rootScope.ngcCommon.showIssue("Unexpected Save action failure ", "Thingworx/PTCSC.SOWI.WorkTrack.Manager/Services/" + serviceName + " failed!" + "\n" + "The status returned was:  " + status + "\n" + "params =" + JSON.stringify(params));
          }
        )
    } catch (e) {
      console.log("THX Service " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
      $rootScope.ngcCommon.showIssue("Unexpected Thingworx " + serviceName + " Failure", 'Check application key or if server is running or error was ' + e);
    }


  }



});