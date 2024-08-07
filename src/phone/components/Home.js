// $scope, $element, $attrs, $injector, $sce, $timeout, $http, $ionicPopup, and $ionicPopover services are available

console.log(">>>> "+ $scope.app);

$scope.$on("$ionicView.loaded", function (event) {
  $scope.view.wdg.sxsldebug = JSON.parse($scope.app.params.sxsldebug);
});
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Exposed Studio Functions
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

$scope.showHideSteps = function () {
  let x = $scope.view.wdg['sxslPlayer-1']['steplist'];
  $scope.view.wdg['repeater-1'].data = x;  
  let state = $scope.getWidgetProp("popupSteps" , "visible");
  if (state === true) {
    $scope.setWidgetProp("popupSteps" , "visible" , false);
  } else {
    $scope.setWidgetProp("popupSteps" , "visible", true);
  }
}

$scope.toggleInfo = function () {
  
  let state = $scope.getWidgetProp("popupSettingInfo", "visible");
  let result = state === "visible" ? $scope.setWidgetProp("popupSettingInfo", "visible" , false) : $scope.setWidgetProp("popupSettingInfo", "visible" , true)
  
}


$scope.returnToStart = function () {  
  $scope.app.params.prefill = [];
  $scope.app.fn.navigate("startPoint");  
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

$scope.$on('stepStart', function (evt, step) {
  $rootScope.logger.output("Step Start", "startPoint.js - stepStart Listener")
  if ($scope.app.params.sessionId != undefined) {
    let stepTitle = $rootScope.sxslHelper.getTitle();
    let stepDescription = $rootScope.sxslHelper.getStepDescriptionById(step.id);
    let stepStartTime = Date.now();
    let si = $rootScope.sxslHelper.getWorkTrackSessionId();
    $scope.startStep(si, step.id, step.title, stepDescription, stepStartTime);
  }


});



// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//
// Will execute when the STEP ENDS - stepEnd
//
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
$scope.$on('stepEnd', function (evt, step) {
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
      $scope.endStep(sessionId, step.id, acknowledgement);
      clearInterval(checkActionPending);
    }
  }, 1000); // checks every 1000 milliseconds (1 second)


});



// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//
// Will execute when the ACTION DELIVERED - actionInputDelivered
//
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
$scope.$on('actionInputDelivered', function (evt, action) {
  $scope.actionInputDelivered(action.action);
})



// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//
// Will execute when the ACTION STARTS - actionStart
//
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

$scope.$on('actionStart', function (evt, action) {
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

// 
// Will execute when the Procedure is finshed.
//
$rootScope.$on('procEnd', function (evt, procedure) {
  $rootScope.logger.output("Procedure End:", "startPoint.js - procEnd Listener")
  let sessionId = $rootScope.sxslHelper.getWorkTrackSessionId();
  $scope.endProcedure(sessionId);
});



$scope.startStep = function (sessionId, stepId, stepTitle, stepDescription, stepStartTime) {
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






$scope.actionInputDelivered = function (action) {
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

  let actionDuration = 1;
  if (responseArray != undefined && responseArray.length > 0) {
    actionDuration = $rootScope.sxslHelper.setActionEndTime(actionId, responseArray[0].time);
  }
  
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








$scope.endStep = function (sessionId, stepId, acknowledgement) {


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





// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//
// Will execute when the PROCEDURE END - EndProcedureSession
//
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

$scope.endProcedure = function (sessionId) {
  $rootScope.logger.output("Procedure End:", "startPoint.js - endProcedure", 2);

  //let serviceName = "EndProcedureSession";  
  let serviceName =  SetWorkOrderProcedureStatus ;
  try {


    let params = {
      workOrderNumber: $rootScope.getWorkOrder(),
      procedureId: $rootScope.getId(),
      procedureVersion: $rootScope.getVersionId(),
      status : "complete"

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
