// $scope, $element, $attrs, $injector, $sce, $timeout, $http, $ionicPopup, and $ionicPopover services are available

console.log(">>>> " + $scope.app);

$scope.$on("$ionicView.loaded", function (event) {

});
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Exposed Studio Functions
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

$scope.showHideSteps = function () {
  let x = $scope.view.wdg['sxslPlayer-1']['steplist'];
  $scope.view.wdg['repeater-1'].data = x;
  let state = $scope.getWidgetProp("popupSteps", "visible");
  if (state === true) {
    $scope.setWidgetProp("popupSteps", "visible", false);
  } else {
    $scope.setWidgetProp("popupSteps", "visible", true);
  }
}

$scope.toggleInfo = function () {

  let state = $scope.getWidgetProp("popupSettingInfo", "visible");
  let result = state === "visible" ? $scope.setWidgetProp("popupSettingInfo", "visible", false) : $scope.setWidgetProp("popupSettingInfo", "visible", true)

}

$scope.$on('actionEnd', function (evt, action) {
  if ($rootScope.ngcCommon.doAPIs()) {
    $rootScope.ngcCommon.actionEndProcessing(evt, action)
  }
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
  if ($rootScope.ngcCommon.doAPIs()) {
    if ($scope.app.params.sessionId != undefined) {
      let stepTitle = $rootScope.sxslHelper.getTitle();
      let stepDescription = $rootScope.sxslHelper.getStepDescriptionById(step.id);
      let stepStartTime = Date.now();
      let si = $rootScope.sxslHelper.getWorkTrackSessionId();
      $rootScope.ngcCommon.startStep(si, step.id, step.title, stepDescription, stepStartTime);
    }
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
  if ($rootScope.ngcCommon.doAPIs()) {
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
        $rootScope.ngcCommon.endStep(sessionId, step.id, acknowledgement);
        clearInterval(checkActionPending);
      }
    }, 1000); // checks every 1000 milliseconds (1 second)
  }

});

$scope.$on('actionInputDelivered', function (evt, action) {
  if ($rootScope.ngcCommon.doAPIs()) {
    $rootScope.ngcCommon.actionInputDelivered(action.action);
  }
})

$scope.$on('actionStart', function (evt, action) {
  if ($rootScope.ngcCommon.doAPIs()) {
    let actionId = action.id;
    let actionInput = 'test input'; // place holder
    let inputFileExtension = '';
    let actionDescription = action.instruction;
    let sessionId = $rootScope.sxslHelper.getWorkTrackSessionId();
    let inputImage = " ";
    let actionName = action.base.actiontitle;
    $rootScope.sxslHelper.setActionStartTime(action.id, new Date().getTime());
    let step = $rootScope.sxslHelper.getStepbyID(action.stepid);
  }
});

$scope.$on('procEnd', function (evt, procedure) {
  $rootScope.logger.output("Procedure End:", "startPoint.js - procEnd Listener")
  if ($rootScope.ngcCommon.doAPIs()) {
    $rootScope.ngcCommon.endProcedure();
  }
});
