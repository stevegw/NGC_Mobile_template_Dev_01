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
