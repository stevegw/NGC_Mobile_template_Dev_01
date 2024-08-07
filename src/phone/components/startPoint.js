console.log($scope.app);
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Globals
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
$scope.viewLoaded = false;
const UPLOADPATH = "app/resources/Uploaded/";
let ShowStartSplash = true;
const DEBUG = JSON.parse($scope.app.params.jloggerdebug);

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// local helper functions
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
showIntroPopup = function (introType, action) {
  $rootScope.logger.output("Start: introType = " + introType, "startPoint.js - showIntroPopup")
  //Common Parameters
  $scope.setWidgetProp("labelProcDescription", "text", $rootScope.sxslHelper.getDescription());
  $scope.setWidgetProp("labelProcVersion", "text", $rootScope.sxslHelper.getVersionId());
  let dateStr = $rootScope.sxslHelper.getPublishedDate();
  let dateObj = new Date(dateStr);
  let readableDate = dateObj.toLocaleString();
  $scope.setWidgetProp("labelProcPubDate", "text", readableDate);
  //Specific Parameters
  // 1 = Scan Needed for Barcode
  // 2 = No WorkOrder needed
  // 3 = Refresh & Resum
  // (showWorkOrder, showHideNewProc, showHideResumeProc, showHideInputWO, showHideEnterButton)
  switch (parseInt(introType)) {
    case 1:
      $rootScope.logger.output("IntroType = 1", "startPoint.js - showIntroPopup",3)      
      $scope.setWidgetProp("labelUserMessage", "text", "Procedure Needs a Work Order Number");
      $scope.showHideProcButtons(true, false, false, true, true);
      break;
    case 2:
    default:
      $rootScope.logger.output("IntroType = 2 or Default", "startPoint.js - showIntroPopup",3)
      $scope.setWidgetProp("labelUserMessage", "text", "Click New to start Procedure");
      $scope.showHideProcButtons(false, false, false, false, false);
      $scope.view.wdg['startNoWorkOrder'].visible = true;
      break;
    case 3:
      $rootScope.logger.output("IntroType = 3 Refresh & Resume", "startPoint.js - showIntroPopup",3 )
      $scope.setWidgetProp("labelUserMessage", "text", "Procedure with #" + action.wonum + " has already '" + action.workOrderProcedureStatus + "' Click Start New  WorkOrder or Resume");
      $scope.showHideProcButtons(false, true, true, false, false);
      break;
  }

  try {
    $scope.setWidgetProp("labelProcIntro", "text", $rootScope.sxslHelper.getTitle());
  } catch (err) {
    //ignore 
    $scope.setWidgetProp("labelProcIntro", "text", "No introduction found");
  }
  $scope.setWidgetProp("popupIntro", "visible", true);
}

$scope.resetForNewProcedure = function () {
  //$rootScope.sxslHelper.setFreshRun(true);
  //$scope.setWidgetProp("labelUserMessage", "text", "Click New to start Procedure");
  //showHideProcButtons(true, false, false, true, true);
  showIntroPopup(1, {});
}


// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Exposed Studio Functions
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

$scope.toggleInfo = function () {
  let state = $scope.getWidgetProp("popupHelp", "visible");
  let result = state === "visible" ? $scope.setWidgetProp("popupIntro", "visible", false) : $scope.setWidgetProp("popupIntro", "visible", true);
}

$scope.showHideProcButtons = function (showWorkOrder, showHideNewProc, showHideResumeProc, showHideInputWO, showHideEnterButton) {
  $rootScope.logger.output("Input Params: " + showWorkOrder + ", " + showHideNewProc + ", " + showHideResumeProc + ", " + showHideInputWO + ", " + showHideEnterButton, "startPoint.js - showHideProcButtons", 2)
  $scope.setWidgetProp("buttonScanForWorkOrder", "visible", showWorkOrder);
  $scope.setWidgetProp("buttonStartNewProc", "visible", showHideNewProc);
  $scope.setWidgetProp("buttonResumeProc", "visible", showHideResumeProc);
  $scope.setWidgetProp("textInputWorkOrder", "visible", showHideInputWO);
  $scope.setWidgetProp("buttonEnter", "visible", showHideEnterButton);
        
  $scope.$applyAsync();
}

$scope.checkForScan = function () {
  let introType;
  let scanneeded = $rootScope.sxslHelper.WOScanNeeded();
  $rootScope.logger.output("Scan needed = " + scanneeded, "Start.js - checkForScan");
  if (scanneeded) {
    $rootScope.logger.output("TRUE Part of if", "Start.js - checkForScan");
    introType = 1  // Scan needed for Barcode and
  }
  else {
    introType = 2   //Proceedure w/no NGC specific Barcode scan
    $rootScope.logger.output("FALSE Part of if", "Start.js - checkForScan");
  }

  showIntroPopup(introType,{});

}


$scope.scanComplete = function () {
  $scope.handleWorkOrderEntry(false);
}


$scope.handleWorkOrderEntry = function (isManual) {
  $rootScope.logger.output ("Start parameter = " + isManual,"startPoint.js - handleWorkOrderEntry")
  let wonum;
  if (isManual) {
    wonum = $scope.getWidgetProp("textInputWorkOrder", "text");
  } else {
    wonum = $scope.getWidgetProp('scanWorkOrder', 'scannedValue');
  }
  $rootScope.ngcCommon.startFlow(wonum);
}

$scope.systemFullyInit = function () {
  if ($rootScope.dataRead && $scope.viewLoaded) {
    $rootScope.logger.output("Fully Init: All Conditions pass", "Start.js - systemFullyInit");
    $scope.checkForScan();
  }
}


$scope.startNewProcedure = function () {

  if ($rootScope.sxslHelper.getWorkOrder() !== undefined && $rootScope.sxslHelper.getWorkOrder() !== "") {

    let stepId = $rootScope.sxslHelper.getStepIdByNum(2);
    $scope.app.params.prefill = $rootScope.sxslHelper.getWorkTrackResumePreReq(stepId);

    let firstStepId = $rootScope.sxslHelper.getStepIdByNum(1);
    $scope.app.params.firstStepID = firstStepId;

  }

  $scope.app.fn.navigate("Home");

}


$scope.resumeProcedure = function () {

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
// Load Libary functions - readFiles will launch on loading the experience 
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function readFiles(src) {
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
  readFiles("Uploaded/sowiplayer/jlogger.js")
    .then(function () {
      $rootScope.logger = new Jlogger("SOWI NGC Player", "GLOBAL")
      $rootScope.logger.setShowOutput(DEBUG);
      $rootScope.logger.output("Logger is initializated and ready", "Start.js - loadLibary");
      //Custom Logger
      //Sample
      // $rootScope.logger.output("Scan is finished, VIN = " + scaninfo, "scanfinshed")
      // $rootScope.logger.output(<message>, <location -OPTIONAl>, <depth -OPTIONAL>)
      if (!$rootScope.sxslHelper) {
        readFiles('Uploaded/sowiplayer/coeSxSLHelper.js')
          .then(function () {
            $rootScope.sxslHelper = new coeSxSLHelper($scope)
            readFiles('Uploaded/sowiplayer/ngcHelper.js')
              .then(function () {
                $rootScope.ngcCommon = new ngcHelper($scope, $http, $rootScope.sxslHelper, $rootScope.logger)
                $rootScope.ngcCommon.setWorkTrackURLPrefix('/Thingworx/Things/PTCSC.SOWI.WorkTrack.Manager/Services/')
                var filepath = "./app/resources/Uploaded/sowi.json";
                fetch(filepath)
                  .then(response => response.text())
                  .then(data => $rootScope.sxslHelper.setSxSL(JSON.parse(data)))
                  .then(function () {
                    $rootScope.dataRead = true;
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


$scope.$on("$ionicView.loaded", function (event) {
  $scope.viewLoaded = true;
  $scope.systemFullyInit();
  // Code here

});
