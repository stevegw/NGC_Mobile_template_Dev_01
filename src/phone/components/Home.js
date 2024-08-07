// $scope, $element, $attrs, $injector, $sce, $timeout, $http, $ionicPopup, and $ionicPopover services are available

console.log(">>>> "+ $scope.app);

$scope.$on("$ionicView.loaded", function (event) {
  
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

$scope.$on('actionEnd', function(evt, action) {
  $rootScope.ngcCommon.actionEndProcessing(evt,action)
});

$scope.returnToStart = function () {  
  //HERE
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
    $rootScope.ngcCommon.startStep(si, step.id, step.title, stepDescription, stepStartTime);
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
  $rootScope.logger.output("AckType Test Full JSON: " + JSON.stringify(step.ack));
  let acktype;
  if (step.ack) {
    acktype = step.ack.type;
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
  }

  var checkActionPending = setInterval(function () {
    if (!$rootScope.ngcCommon.getActionPending()) {
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
  $rootScope.ngcCommon.actionInputDelivered(action.action);
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
$scope.$on('procEnd', function (evt, procedure) {
  $rootScope.logger.output("Procedure End:", "startPoint.js - procEnd Listener")  
  $scope.endProcedure();
});

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//
// Will execute when the PROCEDURE END - EndProcedureSession
//
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

$scope.endProcedure = function () {
  $rootScope.logger.output("Procedure End:", "startPoint.js - endProcedure", 2);

  let serviceName =  "SetWorkOrderProcedureStatus" ;
  try {

    let params = {
      workOrderNumber: $rootScope.sxslHelper.getWorkOrder(),
      procedureId: $rootScope.sxslHelper.getId(),
      procedureVersion: $rootScope.sxslHelper.getVersionId(),
      status : "finished"
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






